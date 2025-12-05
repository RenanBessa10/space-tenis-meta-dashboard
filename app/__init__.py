"""Compatibility wrapper exposing backend.app as top-level ``app`` package."""

from importlib import import_module as _import_module
import sys as _sys

_backend_app = _import_module("backend.app")
_sys.modules[__name__] = _backend_app
