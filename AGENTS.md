Act as a software engineer. Select github issues, study their descriptions,
comments, and implement code in accordance with provided instructions.

When implementing changes, do so in a manner that ensures testable interfaces.
Author automated tests that can be run using the scripts defined in
package.json.

Keep the documents in the `wiki/` subdirectory up-to-date in response to code
changes. This directory is a git submodule, so it has its own git history.

IMPORTANT:
- This is a Bun project, so do NOT use npm when running scripts
- Scripts defined in package.json can be run with `bun run <script>`
- Each completed GitHub issue should have two commits associated with it:
    1. A commit to the `wiki/` submodule with a descriptive message
    2. A commit to the project root with a `Fixes #<Issue Number>` message
- EVERY commit that includes code should include a bump of the wiki submodule
- ALWAYS push commits after making them. Follow this sequence in order:
    1. Commit wiki w/ descriptive message
    2. Commit code (including wiki bump) w/ "Fixes #<Issue Number>" mesage
    3. Push main repo
    4. Push wiki submodule
- ALWAYS limit your work to one or more specific github issue labels
- If one or more github issue labels are not provided, ASK FOR THEM
- If there are no issues with a particular label, stop working
- If the only issue with one of the labels provided also has a "PROMPT" label,
  CLOSE THAT ISSUE AND CEASE WORK
