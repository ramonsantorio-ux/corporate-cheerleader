const fs = require('fs');

const file = 'src/pages/Eventos.tsx';
let content = fs.readFileSync(file, 'utf8');

// The exact block to replace
const searchBlock = `                  <PieChart>
                    <Pie data={analytics.topLocations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={({ name, percent }) => \`\${(percent * 100).toFixed(0)}%\`} labelLine={false}>
                      {analytics.topLocations.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {analytics.topLocations.map((loc, i) => (
                <span key={loc.name} className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {loc.name} ({loc.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>`;

const replaceBlock = `                  <PieChart>
                    <Pie data={analytics.topLocations} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label={({ name, percent }) => \`\${(percent * 100).toFixed(0)}%\`} labelLine={false}>
                      {analytics.topLocations.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ExpandableChart>
            </div>
          </CardContent>
        </Card>
      </div>`;

content = content.replace(searchBlock, replaceBlock);
fs.writeFileSync(file, content, 'utf8');
