const fs = require('fs');

let code = fs.readFileSync('src/components/HomeTab.tsx', 'utf8');

const renderEditorial = `
          {activeSubTab === 'editorial' ? (
            <>
              {/* Novedades / Álbumes de la semana */}
              {renderSectionHeader("Álbumes de la semana", "Los álbumes más interesantes de la semana.")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {editorPicks.slice(0, 8).map((item) => (
                  <div 
                    key={item.id} 
                    className="flex-none w-[160px] cursor-pointer group"
                    onClick={() => setSelectedAlbumId(item.id.toString())}
                  >
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      <img src={item.image?.large} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-[#E15328] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 uppercase">
                        <Disc size={10} /> ÁLBUM DE LA SEMANA
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{item.title}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="bg-gray-200 dark:bg-gray-800 text-[10px] font-bold px-1 rounded text-gray-500">E</span>
                          <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.artist?.name}</p>
                        </div>
                      </div>
                      {item.hires && (
                        <div className="bg-[#FFB800] text-black text-[9px] font-black px-1 py-0.5 rounded uppercase shrink-0 mt-0.5 leading-none">
                          Hi-Res<br/>Audio
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Álbumes */}
              {renderSectionHeader("Top Álbumes", "Álbumes más reproducidos en streaming.")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {/* Split into chunks of 3 for vertical stacking */}
                {Array.from({ length: Math.ceil(mostStreamed.length / 3) }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-none w-[300px] flex flex-col gap-4">
                    {mostStreamed.slice(colIndex * 3, colIndex * 3 + 3).map((item, rowIdx) => {
                      const globalIdx = colIndex * 3 + rowIdx + 1;
                      return (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-4 cursor-pointer group"
                          onClick={() => setSelectedAlbumId(item.id.toString())}
                        >
                          <span className="text-[18px] font-bold text-gray-800 dark:text-white w-6 text-center">
                            {globalIdx < 10 ? \`0\${globalIdx}\` : globalIdx}
                          </span>
                          <div className="relative w-[70px] h-[70px] rounded overflow-hidden shrink-0">
                            <img src={item.image?.small || item.image?.large} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[15px] line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="bg-gray-200 dark:bg-gray-800 text-[10px] font-bold px-1 rounded text-gray-500">E</span>
                              <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.artist?.name}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Playlists de Qobuz */}
              {renderSectionHeader("Playlists de Qobuz", "Seleccionado por nuestros expertos.")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {playlists.map((item) => (
                  <div key={item.id} className="flex-none w-[160px] cursor-pointer group">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {/* Using the root image if available, else standard image */}
                      {item.images300 && item.images300.length === 4 ? (
                        <div className="grid grid-cols-2 w-full h-full">
                          <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[1]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[2]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[3]} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : item.images300 && item.images300.length > 0 ? (
                        <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.image?.large || item.image?.root || item.image_rectangle?.[0]} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{item.name}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mt-1">SELECCIÓN DEL EQUIPO</p>
                  </div>
                ))}
              </div>

              {/* Playlists por categoría */}
              {renderSectionHeader("Playlists por categoría", "Perfectas para cada momento.")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {[
                  { title: 'Hi-Res', color: 'from-[#D9772F] to-[#E59858]' },
                  { title: 'Foco', color: 'from-[#5433C4] to-[#7B5EE3]' },
                  { title: 'Novedades', color: 'from-[#C43343] to-[#E35E6D]' },
                  { title: 'Humores', color: 'from-[#D96B2F] to-[#E58D58]' },
                  { title: 'Relax', color: 'from-[#3381C4] to-[#5EA1E3]' }
                ].map((cat) => (
                  <div key={cat.title} className="flex-none w-[160px] aspect-[4/3] rounded-lg overflow-hidden relative cursor-pointer">
                    <div className={\`absolute inset-0 bg-gradient-to-br \${cat.color} opacity-90\`} />
                    <h3 className="absolute bottom-3 left-3 text-white font-bold text-lg">{cat.title}</h3>
                  </div>
                ))}
              </div>

              {/* Canta al ritmo de la letra */}
              {renderSectionHeader("Canta al ritmo de la letra", "Vuelve a descubrir tus canciones favoritas con la letra ahora disponible en el reproductor.")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {[
                  { title: 'Karaoke - Reggaeton', bg: 'bg-[#B07348]' },
                  { title: 'Karaoke - Años 1980', bg: 'bg-[#8F3B55]' },
                  { title: 'Karaoke - Pop Español', bg: 'bg-[#B05B7C]' }
                ].map((karaoke) => (
                  <div key={karaoke.title} className="flex-none w-[200px] cursor-pointer group">
                    <div className={\`relative aspect-square mb-3 rounded-lg overflow-hidden \${karaoke.bg} flex items-center justify-center\`}>
                      <div className="text-white text-3xl font-black italic shadow-sm tracking-tighter">
                        KARAOKE
                      </div>
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">{karaoke.title}</h3>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase mt-1">KARAOKE</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Para ti Content */}
              {renderSectionHeader("Tu música", "Sigue escuchando y descubre más.")}
              <div className="px-4 pb-6 flex gap-4 overflow-x-auto no-scrollbar">
                
                {/* My Weekly Q */}
                <div className="flex-none w-[280px] aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-800 opacity-95 transition-transform group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                        <Heart size={16} className="text-white fill-white" />
                      </div>
                      <h3 className="text-white font-bold text-xl leading-tight">My Weekly Q</h3>
                      <p className="text-white/80 text-[13px] mt-1 line-clamp-2">Una mezcla basada en tus últimos descubrimientos.</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase">
                      <Play size={12} className="fill-white" /> Escuchar
                    </div>
                  </div>
                </div>

                {/* Nuevos lanzamientos para ti */}
                <div className="flex-none w-[280px] aspect-[16/9] rounded-xl overflow-hidden relative cursor-pointer group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 opacity-95 transition-transform group-hover:scale-105 duration-500" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-2">
                        <Disc size={16} className="text-white" />
                      </div>
                      <h3 className="text-white font-bold text-xl leading-tight">Lanzamientos para ti</h3>
                      <p className="text-white/80 text-[13px] mt-1 line-clamp-2">Lo nuevo de los artistas que te gustan.</p>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase">
                      <Play size={12} className="fill-white" /> Escuchar
                    </div>
                  </div>
                </div>

              </div>

              {renderSectionHeader("Mixes basados en tus gustos")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {playlists.slice(0, 5).map((item, idx) => (
                  <div key={item.id + 'mix'} className="flex-none w-[160px] cursor-pointer group">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {item.images300 && item.images300.length === 4 ? (
                        <div className="grid grid-cols-2 w-full h-full">
                          <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[1]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[2]} alt={item.name} className="w-full h-full object-cover" />
                          <img src={item.images300[3]} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : item.images300 && item.images300.length > 0 ? (
                        <img src={item.images300[0]} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.image?.large || item.image?.root || item.image_rectangle?.[0]} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                           <Play className="fill-black text-black ml-1" size={20} />
                         </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight">Mix {idx + 1}</h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
              
              {renderSectionHeader("Artistas similares a lo que escuchas")}
              <div className="flex overflow-x-auto pb-6 px-4 gap-4 no-scrollbar">
                {mostStreamed.slice(0, 6).map((item) => (
                  <div key={item.id + 'artist'} className="flex-none w-[140px] cursor-pointer group flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border shadow-sm">
                      <img src={item.image?.small || item.image?.large} alt={item.artist?.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-[15px] line-clamp-1 leading-tight w-full">{item.artist?.name}</h3>
                  </div>
                ))}
              </div>

            </>
          )}`;

const startIdx = code.indexOf('{/* Novedades / Álbumes de la semana */}');
const endMarker = '</div>\n      )}\n    </div>';
const endIdx = code.lastIndexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + renderEditorial + "\n        " + code.substring(endIdx);
  fs.writeFileSync('src/components/HomeTab.tsx', code);
}
