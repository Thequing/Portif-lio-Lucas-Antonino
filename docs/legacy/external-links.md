# External links carried over from the legacy `index.html`

Extracted before Task 3 replaced `index.html` in place. Task 10 Step 4 requires
every one of these verbatim; they are not recoverable from the rebuilt page.

Source: `index.html` at commit `304fadf` (line numbers from that revision).

| Section | Link type | i18n key | URL | Legacy line |
| --- | --- | --- | --- | --- |
| Steam Veins | Steam page | `nav.steam` | `https://store.steampowered.com/app/3201780/Steam_Veins/` | 526 |
| Steam Veins | Demo | `nav.demo` | `https://drive.google.com/file/d/1FfMGEfl98RtVbwcl-iNgrTfCKKT5UiSN/view?usp=sharing` | 536 |
| Dino Girls | Steam page | `nav.steam` | `https://store.steampowered.com/app/3495120/Dino_Girls/` | 605 |
| MidNight Memories | Project folder | `nav.project` | `https://drive.google.com/drive/folders/1BYW8EsY5dRsjF65luDag1ndC3lO6xUBb?usp=drive_link` | 740 |
| Johnny G | Project folder | `nav.project` | `https://drive.google.com/drive/folders/19SzIwTArMxGAcWTd6az3VDaEXzajdj0R?usp=sharing` | 812 |
| Code | GitHub | `code.link` | `https://github.com/Thequing` | 441 |
| Contact | GitHub | — | `https://github.com/Thequing` | 884 |
| Contact | LinkedIn | — | `https://linkedin.com/in/lucas-antonino` | 889 |
| Contact | Email | — | `mailto:lvantonino@hotmail.com` | — |

## Notes

- **KuroNeko has no external link** in the legacy page. Do not invent one.
- The plan's Task 10 Step 4 says "the two Google Drive links". There are **three**:
  a single-file Demo link for Steam Veins, and two folder links for MidNight
  Memories and Johnny G. All three must survive.
- `https://github.com/Thequing` appears twice (code section and contact list) and is
  the same destination; the rebuilt page uses it in both places.
- The email is `lvantonino@hotmail.com`. It is not a `https://` URL so it does not
  appear in a naive URL grep of the legacy file — it was easy to lose.
- `nav.steam`, `nav.demo`, and `nav.project` in `js/i18n.js` already correspond
  exactly to the three link labels the legacy page used.
