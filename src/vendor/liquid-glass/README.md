# Liquid Glass adapter

Source: https://github.com/dashersw/liquid-glass-js/blob/main/container.js
Downloaded 2026-10-07. MIT license is retained in LICENSE.

The upstream rounded shape, refraction, rim light, blur and shader implementation is used by the home search surface. Local changes add an ESM export, cleanup, cancellable sizing and a decorative gradient texture instead of html2canvas(document.body). No form content or personal information is captured. DOM text/input controls remain native React elements above the decoration. CSS backdrop-filter supplies the live background blur and acts as fallback. The layer draws on sizing/scroll events instead of running its own animation loop.
