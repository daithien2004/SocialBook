# Self-hosted fonts

- `InterVariable.woff2`: Inter v4.1, downloaded from the official `rsms/inter` release source; see `LICENSE.txt`.
- `Merriweather-*.woff2`: Merriweather v33 Latin and Vietnamese subsets from Google Fonts; see `Merriweather-OFL.txt`.
- `NotoSans-*.woff2`: Noto Sans v42 Latin and Vietnamese subsets from Google Fonts; see `NotoSans-OFL.txt`.

Inter is loaded through `next/font/local` in `src/app/layout.tsx`. Merriweather and Noto Sans use local `@font-face` declarations in `src/app/globals.css` so their separate Latin and Vietnamese subsets keep their Unicode ranges and are fetched only when used.
