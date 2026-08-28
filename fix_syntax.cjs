const fs = require('fs');
let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

code = code.replace(
  `                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{karaoke.title}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mt-1">KARAOKE</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full">`,
  `                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{karaoke.title}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mt-1">KARAOKE</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
          ) : (
            <div className="h-full">`
);
fs.writeFileSync('src/components/HomeTab.tsx', code);
