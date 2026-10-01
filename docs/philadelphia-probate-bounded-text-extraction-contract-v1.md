# Philadelphia Probate Bounded PDF Text Extraction Contract v1

## Purpose

Define the minimum production-safe boundary for extracting text from one
already-authorized Philadelphia probate PDF without granting probate parsing,
lead creation, persistence, county mutation, or acquisition authority.

This contract does not itself authorize production execution.

## Certified source identity

The extraction increment is bound to exactly:

- publication date: `2026-09-30`
- source basename: `tlipn093026.pdf`
- source URL:
  `https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`
- source URL SHA-256:
  `98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`
- certified PDF byte length: `4220387`
- certified PDF content SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`
- maximum accepted PDF size: `26214400` bytes

A different PDF, URL, publication date, byte length, or content SHA-256 is
outside this contract.

## Architecture boundary

The existing connector helper `extractProbateNoticeText_` MUST NOT be invoked
by this increment.

That helper combines:

1. source URL validation,
2. `UrlFetchApp.fetch`,
3. PDF blob acquisition,
4. `Drive.Files.create`,
5. `DocumentApp.openById`,
6. text extraction,
7. temporary Drive cleanup.

The bounded extraction increment MUST separate transport from extraction.

## Input boundary

The extraction implementation MUST operate on PDF bytes or a PDF Blob that
has already been obtained by a separately authorized bounded transport.

Before any Drive/OCR operation, it MUST verify:

1. input exists;
2. input byte length is exactly `4220387`;
3. input byte length does not exceed `26214400`;
4. first bytes identify a PDF using `%PDF-`;
5. SHA-256 of the exact input bytes is exactly
   `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

A mismatch MUST fail closed before temporary Drive artifact creation.

## Network prohibition

The extraction component MUST NOT contain or invoke:

- `UrlFetchApp.fetch`
- source discovery
- `PhiladelphiaProbateRecurringSource.resolve`
- connector `fetch_`
- `probateSourcePreflight_`
- `probateSourceAuthority`
- connector registration

The extraction component has zero independent HTTP authority.

It MUST NOT refetch the certified PDF.

## OCR authority

For one verified PDF input only, the extraction boundary MAY perform:

1. exactly one `Drive.Files.create` operation converting the PDF blob to a
   temporary Google document with OCR language `en`;
2. exactly one `DocumentApp.openById` operation for the returned temporary
   document ID;
3. exactly one body-text extraction from that document;
4. exactly one cleanup attempt for that exact temporary document.

No other Drive document or file may be opened, modified, trashed, or deleted.

## Temporary artifact lifecycle

The temporary Google document is ephemeral extraction infrastructure only.

The implementation MUST:

1. retain the exact temporary document ID returned by `Drive.Files.create`;
2. use only that ID for `DocumentApp.openById`;
3. use only that ID for cleanup;
4. attempt cleanup on every path after temporary document creation;
5. expose whether cleanup succeeded;
6. fail closed if cleanup cannot be confirmed.

A successful extraction result MUST NOT be returned when cleanup failed.

The implementation MUST NOT silently swallow cleanup failure.

## Text boundary

Extracted text MUST:

1. be non-empty after trimming;
2. remain raw extraction text only;
3. not be interpreted as probate records;
4. not create normalized probate records;
5. not create distress leads;
6. not persist to Sheets, Properties, Drive files, databases, or other REOS
   storage.

The first bounded production extraction RPC MUST return extraction evidence
only.

It MUST NOT return the entire extracted text.

The result may return bounded metadata such as:

- `ok`
- source identity
- PDF content SHA-256
- PDF byte length
- extracted text character count
- extracted text SHA-256
- a tightly bounded diagnostic preview if separately allowed by the
  implementation contract
- temporary artifact created
- temporary artifact cleanup confirmed
- OCR execution count
- DocumentApp open count

No raw PDF bytes may be returned.

## Output-size boundary

The implementation MUST define an explicit maximum accepted extracted-text
length before production execution is authorized.

An oversized extraction MUST fail closed.

The implementation validator MUST prove that this bound exists and is
enforced.

## Side-effect boundary

The only mutation authority contemplated by this contract is the lifecycle of
one temporary OCR document:

- one temporary document creation;
- one read;
- one cleanup of that exact document.

This contract grants no authority for:

- persistent Drive storage;
- PropertiesService mutation;
- SpreadsheetApp mutation;
- county-data mutation;
- connector configuration;
- source configuration;
- scheduler mutation;
- trigger mutation;
- checkpoint mutation;
- acquisition lifecycle mutation;
- Qualified Deal Queue mutation.

## Acquisition safety boundary

This increment grants no:

- ARV authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

Extracted text is evidence only.

Any later probate parsing, property matching, distress-lead creation,
qualification, ARV, repair-scope, MAO, or offer operation requires a separate
contract and authorization.

## Fail-closed requirements

The implementation MUST fail closed for at least:

1. missing PDF input;
2. wrong byte length;
3. PDF larger than maximum accepted size;
4. invalid PDF signature;
5. wrong PDF content SHA-256;
6. missing Advanced Drive service;
7. missing DocumentApp service;
8. Drive conversion failure;
9. conversion result missing document ID;
10. DocumentApp open failure;
11. empty extracted text;
12. extracted text above the configured maximum;
13. cleanup failure.

After temporary document creation, cleanup MUST still be attempted when text
opening, reading, validation, or output-bound checks fail.

## Offline validator requirements

Before production implementation can be considered certified, offline tests
MUST prove:

- zero `UrlFetchApp` surface;
- zero source-discovery surface;
- zero connector-fetch surface;
- zero connector-registration surface;
- PDF identity verification precedes OCR creation;
- at most one `Drive.Files.create`;
- at most one `DocumentApp.openById`;
- cleanup targets exactly the created temporary document ID;
- cleanup is attempted after every post-create failure;
- cleanup failure prevents success;
- no persistence surface;
- no county mutation surface;
- no probate parsing or lead creation;
- no ARV/repair-scope/MAO/offer authority.

## Required gates before any production OCR execution

1. certify this design contract;
2. implement the extraction boundary offline;
3. pin the maximum extracted-text length;
4. create deterministic behavior tests;
5. prove PDF SHA verification occurs before Drive creation;
6. prove single temporary-artifact lifecycle;
7. prove cleanup on all post-create paths;
8. prove cleanup failure fails closed;
9. integrate runtime accounting without changing historical reconciled
   production inventory semantics;
10. pass CI;
11. merge;
12. certify post-merge main;
13. deploy through a separately authorized deployment-only gate;
14. certify production source/deployment state;
15. separately authorize exactly one bounded production extraction RPC.

No production OCR authority is granted by this design contract.
