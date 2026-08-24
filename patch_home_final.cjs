const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

// There are probably multiple fragment tags </>. We only want one at the end.
// Let's rewrite the end of the file completely to avoid duplicate closing tags.

const endPattern = ")}";

const finalEnd = `          )}
        </div>
      )}
    </div>
    </>
  );
}`;

// find the last occurrence of )}
let lastIndex = code.lastIndexOf('          )}');
if (lastIndex !== -1) {
  code = code.substring(0, lastIndex) + finalEnd;
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
