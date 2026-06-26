from __future__ import annotations

import base64
import ctypes
import os
from ctypes import wintypes


DPAPI_PREFIX = "dpapi:"


class _DataBlob(ctypes.Structure):
    _fields_ = [
        ("cbData", wintypes.DWORD),
        ("pbData", ctypes.POINTER(ctypes.c_char)),
    ]


def secret_protection_available() -> bool:
    return os.name == "nt"


def is_protected_secret(value: str) -> bool:
    return value.startswith(DPAPI_PREFIX)


def protect_secret(value: str) -> str:
    value = value or ""
    if not value or is_protected_secret(value):
        return value
    if not secret_protection_available():
        return value
    try:
        return f"{DPAPI_PREFIX}{_dpapi_protect(value)}"
    except Exception:
        return value


def unprotect_secret(value: str) -> str:
    value = value or ""
    if not is_protected_secret(value):
        return value
    if not secret_protection_available():
        return ""
    try:
        return _dpapi_unprotect(value[len(DPAPI_PREFIX) :])
    except Exception:
        return ""


def _blob_from_bytes(data: bytes) -> tuple[_DataBlob, ctypes.Array[ctypes.c_char]]:
    buffer = ctypes.create_string_buffer(data)
    return _DataBlob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_char))), buffer


def _dpapi_protect(value: str) -> str:
    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    input_blob, _buffer = _blob_from_bytes(value.encode("utf-8"))
    output_blob = _DataBlob()
    ok = crypt32.CryptProtectData(
        ctypes.byref(input_blob),
        ctypes.c_wchar_p("SweetrollLM local secret"),
        None,
        None,
        None,
        0,
        ctypes.byref(output_blob),
    )
    if not ok:
        raise OSError("CryptProtectData failed")
    try:
        encrypted = ctypes.string_at(output_blob.pbData, output_blob.cbData)
    finally:
        kernel32.LocalFree(output_blob.pbData)
    return base64.b64encode(encrypted).decode("ascii")


def _dpapi_unprotect(token: str) -> str:
    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    raw = base64.b64decode(token.encode("ascii"))
    input_blob, _buffer = _blob_from_bytes(raw)
    output_blob = _DataBlob()
    ok = crypt32.CryptUnprotectData(
        ctypes.byref(input_blob),
        None,
        None,
        None,
        None,
        0,
        ctypes.byref(output_blob),
    )
    if not ok:
        raise OSError("CryptUnprotectData failed")
    try:
        decrypted = ctypes.string_at(output_blob.pbData, output_blob.cbData)
    finally:
        kernel32.LocalFree(output_blob.pbData)
    return decrypted.decode("utf-8")
