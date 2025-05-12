<?php include 'partials/header.php'; ?>
<form onsubmit="return false;">
        <div class="container">
            <h1>Hardcore Survivor Challenge</h1>
            
            <div class="tabs">
                <button class="tab-button active" data-tab="roster">Survivor Roster</button>
                <button class="tab-button" data-tab="matches">Match Tracking</button>
                <button class="tab-button" data-tab="credits">Credits</button>
                <button class="tab-button" data-tab="rules">Rules & Price List</button>
            </div>

            <div class="tab-content active" id="roster">
                <div class="mode-toggle">
                    <label class="switch">
                        <input type="checkbox" id="extremeMode" onchange="toggleExtremeMode()">
                        <span class="slider round"></span>
                    </label>
                    <span class="mode-label">Extreme Hardcore Mode (1 Life)</span>
                </div>

                <div class="survivor-grid">
                    <?php
                    $survivors = [
                        'Dwight', 'Meg', 'Claudette', 'Jake', 'Nea', 'David', 'Bill', 'Ace',
                        'Feng', 'Laurie', 'Quentin', 'Tapp', 'Kate', 'Adam', 'Jeff', 'Jane',
                        'Ash', 'Steve', 'Nancy', 'Yui', 'Zarina', 'Cheryl', 'Felix', 'Elodie',
                        'Yun-Jin', 'Jill', 'Leon', 'Mikaela', 'Jonah', 'Yoichi', 'Haddie', 'Ada',
                        'Rebecca', 'Vittorio', 'Thalita', 'Renato', 'Gabriel', 'Nicolas Cage',
                        'Ellen Ripley', 'Alan Wake', 'Sable', 'The Troupe', 'Lara Croft',
                        'Trevor Belmont', 'Taurie', 'Orela'
                    ];

                    // Define survivor ratings
                    $SURVIVOR_RATINGS = [
                        'Dwight' => 3,
                        'Meg' => 3,
                        'Claudette' => 2,
                        'Jake' => 2,
                        'Nea' => 2,
                        'David' => 2,
                        'Bill' => 2,
                        'Ace' => 1,
                        'Feng' => 3,
                        'Laurie' => 2,
                        'Quentin' => 2,
                        'Tapp' => 2,
                        'Kate' => 3,
                        'Adam' => 2,
                        'Jeff' => 2,
                        'Jane' => 2,
                        'Ash' => 1,
                        'Steve' => 2,
                        'Nancy' => 2,
                        'Yui' => 2,
                        'Zarina' => 3,
                        'Cheryl' => 1,
                        'Felix' => 2,
                        'Elodie' => 1,
                        'Yun-Jin' => 1,
                        'Jill' => 2,
                        'Leon' => 1,
                        'Mikaela' => 2,
                        'Jonah' => 2,
                        'Yoichi' => 1,
                        'Haddie' => 1,
                        'Ada' => 2,
                        'Rebecca' => 2,
                        'Vittorio' => 2,
                        'Thalita' => 1,
                        'Renato' => 1,
                        'Gabriel' => 2,
                        'Nicolas Cage' => 1,
                        'Ellen Ripley' => 1,
                        'Alan Wake' => 1,
                        'Sable' => 2,
                        'The Troupe' => 1,
                        'Lara Croft' => 2,
                        'Trevor Belmont' => 2,
                        'Taurie' => 1,
                        'Orela' => 1
                    ];

                    // Load saved state if it exists
                    $savedState = [];
                    if (file_exists('challenge_state.json')) {
                        $savedState = json_decode(file_get_contents('challenge_state.json'), true);
                    }

                    foreach ($survivors as $index => $survivor) {
                        $survivorData = isset($savedState[$survivor]) ? $savedState[$survivor] : [
                            'lives' => 3,
                            'perks' => ['', '', ''],
                            'eliminated' => false,
                            'perma-eliminated' => false
                        ];
                        
                        $eliminatedClass = '';
                        if ($survivorData['perma-eliminated']) {
                            $eliminatedClass = 'perma-eliminated';
                        } else if ($survivorData['eliminated']) {
                            $eliminatedClass = 'eliminated';
                        }
                        ?>
                        <div class="survivor-card <?php echo $eliminatedClass; ?>" data-survivor="<?php echo htmlspecialchars($survivor); ?>">
                            <button type="button" class="reset-card-btn" title="Reset Survivor" onclick="resetSurvivorCard(event, '<?php echo htmlspecialchars($survivor); ?>')">⟳</button>
                            <div class="survivor-image">
                                <img src="images/survivors/<?php echo strtolower(str_replace(' ', '_', $survivor)); ?>.webp" 
                                     alt="<?php echo htmlspecialchars($survivor); ?>"
                                     onerror="this.onerror=null; this.src='images/survivors/<?php echo strtolower(str_replace(' ', '_', $survivor)); ?>.png'; this.onerror=function(){this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='}">
                            </div>
                            <div class="survivor-name"><?php echo htmlspecialchars($survivor); ?></div>
                            <div class="survivor-rating">
                                <div class="stars">
                                    <?php 
                                    $rating = $SURVIVOR_RATINGS[$survivor] ?? 1;
                                    for ($star = 0; $star < 3; $star++): ?>
                                        <span class="star <?php echo $star < $rating ? 'active' : ''; ?>">★</span>
                                    <?php endfor; ?>
                                </div>
                            </div>
                            <div class="lives">
                                <button type="button" class="life-btn minus" onclick="updateLives('<?php echo htmlspecialchars($survivor); ?>', -1)">-</button>
                                <div class="life-display">
                                    <?php for ($j = 0; $j < 3; $j++): ?>
                                        <span class="life <?php echo $j < $survivorData['lives'] ? 'active' : ''; ?>">♥</span>
                                    <?php endfor; ?>
                                </div>
                                <button type="button" class="life-btn plus" onclick="updateLives('<?php echo htmlspecialchars($survivor); ?>', 1)">+</button>
                            </div>
                            <div class="perks">
                                <?php for ($i = 0; $i < 3; $i++): ?>
                                    <div class="perk-slot" data-perk-index="<?php echo $i; ?>">
                                        <?php 
                                            $survivorName = htmlspecialchars($survivor);
                                            $perks = [
                                                'Dwight' => ['Bond', 'Leader', 'Prove Thy Self'],
                                                'Meg' => ['Quick & Quiet', 'Adrenaline', 'Sprint Burst'],
                                                'Claudette' => ['Empathy', 'Botany Knowledge', 'Self-Care'],
                                                'Jake' => ['Iron Will', 'Calm Spirit', 'Saboteur'],
                                                'Nea' => ['Balanced Landing', 'Urban Evasion', 'Streetwise'],
                                                'David' => ['Dead Hard', "We're Gonna Live Forever", 'No-Mither'],
                                                'Bill' => ['Left Behind', 'Borrowed Time', 'Unbreakable'],
                                                'Ace' => ['Ace In The Hole', 'Up The Ante', 'Open-Handed'],
                                                'Feng' => ['Technician', 'Lithe', 'Alert'],
                                                'Laurie' => ['Sole Survivor', 'Object Of Obsession', 'Decisive Strike'],
                                                'Quentin' => ['Wake Up', 'Pharmacy', 'Vigil'],
                                                'Tapp' => ['Tenacity', "Detectives Hunch", 'Stake Out'],
                                                'Kate' => ['Dance With Me', 'Windows Of Opportunity', 'Boil Over'],
                                                'Adam' => ['Diversion', 'Autodidact', 'Deliverance'],
                                                'Jeff' => ['Breakdown', 'Aftercare', 'Distortion'],
                                                'Jane' => ['Poised', 'Head On', 'Solidarity'],
                                                'Ash' => ['Flip-Flop', 'Buckle Up', 'Mettle Of Man'],
                                                'Steve' => ['Babysitter', 'Camaraderie', 'Second Wind'],
                                                'Nancy' => ['Better Together', 'Fixated', 'Inner Strength'],
                                                'Yui' => ['Any Means Necessary', 'Lucky Break', 'Breakout'],
                                                'Zarina' => ['Off The Record', 'Red Herring', 'For The People'],
                                                'Cheryl' => ['Soul Guard', 'Blood Pact', 'Repressed Alliance'],
                                                'Felix' => ['Visionary', 'Desperate Measures', 'Built To Last'],
                                                'Elodie' => ['Appraisal', 'Deception', 'Power Struggle'],
                                                'Yun-Jin' => ['Fast Track', 'Smash Hit', 'Self-Preservation'],
                                                'Jill' => ['Counterforce', 'Resurgence', 'Blast Mine'],
                                                'Leon' => ['Bite The Bullet', 'Flashbang', 'Rookie Spirit'],
                                                'Mikaela' => ['Clairvoyance', 'Boon: Circle Of Healing', 'Boon: Shadow Step'],
                                                'Jonah' => ['Overcome', 'Corrective Action', 'Boon: Exponential'],
                                                'Yoichi' => ['Parental Guidance', 'Empathetic Connection', 'Boon: Dark Theory'],
                                                'Haddie' => ['Inner Focus', 'Residual Manifest', 'Overzealous'],
                                                'Ada' => ['Wiretap', 'Reactive Healing', 'Low Profile'],
                                                'Rebecca' => ['Better Than New', 'Reassurance', 'Hyperfocus'],
                                                'Vittorio' => ['Potential Energy', 'Fogwise', 'Quick Gambit'],
                                                'Thalita' => ['Friendly Competition', 'Teamwork: Power Of Two', 'Cut Loose'],
                                                'Renato' => ['Blood Rush', 'Teamwork: Collective Stealth', 'Background Player'],
                                                'Gabriel' => ['Troubleshooter', 'Made For This', 'Scavenger'],
                                                'Nicolas Cage' => ['Dramaturgy', 'Scene Partner', 'Plot Twist'],
                                                'Ellen Ripley' => ['Chemical Trap', 'Light-Footed', 'Lucky Star'],
                                                'Alan Wake' => ['Champion Of Light', 'Boon: Illumination', 'Deadline'],
                                                'Sable' => ['Invocation: Weaving Spiders', 'Strength In Shadows', 'Wicked'],
                                                'The Troupe' => ['Bardic Inspiration', 'Mirrored Illusion', 'Still Sight'],
                                                'Lara Croft' => ['Finesse', 'Hardened', 'Specialist'],
                                                'Trevor Belmont' => ['Exultation', 'Eyes Of Belmont', 'Moment Of Glory'],
                                                'Taurie' => ['Clean Break', 'Invocation: Treacherous Crows', 'Shoulder The Burden'],
                                                'Orela' => ['Do No Harm', 'Duty Of Care', 'Rapid Response']
                                            ];
                                            $perkRatings = [
                                                // 5 Star Perks
                                                'Decisive Strike' => 5,
                                                'Off The Record' => 5,
                                                'Resurgence' => 5,
                                                'Unbreakable' => 5,
                                                'Deliverance' => 5,

                                                // 4 Star Perks
                                                'Windows Of Opportunity' => 4,
                                                'Deja Vu' => 4,
                                                'Wicked' => 4,
                                                'Lithe' => 4,
                                                'Sprint Burst' => 4,
                                                'Dead Hard' => 4,
                                                'Kindred' => 4,
                                                'Quick Gambit' => 4,
                                                'Bond' => 4,
                                                'Adrenaline' => 4,
                                                'Reassurance' => 4,
                                                'Babysitter' => 4,
                                                'Resilience' => 4,
                                                'Balanced Landing' => 4,
                                                'Flip-Flop' => 4,
                                                'Power Struggle' => 4,
                                                "We're Gonna Live Forever" => 4,
                                                'Made For This' => 4,
                                                'Finesse' => 4,
                                                'Hope' => 4,
                                                'Built To Last' => 4,
                                                'For The People' => 4,

                                                // 3 Star Perks
                                                'Dramaturgy' => 3,
                                                'Overcome' => 3,
                                                'Blood Rush' => 3,
                                                'Saboteur' => 3,
                                                'Wiretap' => 3,
                                                'Head On' => 3,
                                                'Slippery Meat' => 3,
                                                'Up The Ante' => 3,
                                                'Distortion' => 3,
                                                'Plot Twist' => 3,
                                                'Strength In Shadows' => 3,
                                                'Reactive Healing' => 3,
                                                'Second Wind' => 3,
                                                "We'll Make It" => 3,
                                                'No One Left Behind' => 3,
                                                'Borrowed Time' => 3,
                                                'Background Player' => 3,
                                                'Poised' => 3,
                                                'Open-Handed' => 3,
                                                'Aftercare' => 3,
                                                'Empathy' => 3,
                                                'Alert' => 3,
                                                'Inner Focus' => 3,
                                                'Fogwise' => 3,
                                                'Any Means Necessary' => 3,
                                                'Lucky Break' => 3,
                                                'Camaraderie' => 3,
                                                'Iron Will' => 3,
                                                'Soul Guard' => 3,
                                                'Buckle Up' => 3,
                                                'Prove Thy Self' => 3,
                                                'Streetwise' => 3,
                                                'Boon: Circle Of Healing' => 3,
                                                'Botany Knowledge' => 3,
                                                'Empathetic Connection' => 3,
                                                'Self-Care' => 3,
                                                'Inner Strength' => 3,
                                                'Troubleshooter' => 3,
                                                'Blast Mine' => 3,
                                                'Hyperfocus' => 3,
                                                'Stake Out' => 3,
                                                'Boon: Exponential' => 3,
                                                'Boon: Shadow Step' => 3,
                                                'Champion Of Light' => 3,
                                                'Fixated' => 3,
                                                'Vigil' => 3,

                                                // 2 Star Perks
                                                'Mettle Of Man' => 2,
                                                'Detectives Hunch' => 2,
                                                'Breakdown' => 2,
                                                'Wake Up' => 2,
                                                'Moment Of Glory' => 2,
                                                'Pharmacy' => 2,
                                                'Eyes Of Belmont' => 2,
                                                'Object Of Obsession' => 2,
                                                'Desperate Measures' => 2,
                                                'Leader' => 2,
                                                'Sole Survivor' => 2,
                                                'Smash Hit' => 2,
                                                'Chemical Trap' => 2,
                                                'Flashbang' => 2,
                                                'Parental Guidance' => 2,
                                                'Scavenger' => 2,
                                                'Clairvoyance' => 2,
                                                'Tenacity' => 2,
                                                'Teamwork: Power Of Two' => 2,
                                                'Left Behind' => 2,
                                                'Visionary' => 2,
                                                'Lucky Star' => 2,
                                                'Dark Sense' => 2,
                                                'Still Sight' => 2,
                                                'Blood Pact' => 2,
                                                'Lightweight' => 2,
                                                'Better Together' => 2,
                                                'Small Game' => 2,
                                                'Boon: Illumination' => 2,
                                                'Exultation' => 2,
                                                'Overzealous' => 2,
                                                'Solidarity' => 2,
                                                'Corrective Action' => 2,
                                                'Bardic Inspiration' => 2,
                                                'Quick & Quiet' => 2,
                                                'Boil Over' => 2,
                                                'Breakout' => 2,
                                                'Self-Preservation' => 2,
                                                'Light-Footed' => 2,
                                                'Urban Evasion' => 2,
                                                'Potential Energy' => 2,
                                                'Rookie Spirit' => 2,
                                                'Hardened' => 2,
                                                "Plunderer's Instinct" => 2,
                                                'Residual Manifest' => 2,
                                                'Teamwork: Collective Stealth' => 2,
                                                'Dance With Me' => 2,
                                                'Deception' => 2,
                                                'Bite The Bullet' => 2,
                                                'Scene Partner' => 2,
                                                'Better Than New' => 2,
                                                'Autodidact' => 2,
                                                'Mirrored Illusion' => 2,
                                                'Fast Track' => 2,
                                                'Ace In The Hole' => 2,
                                                'Technician' => 2,
                                                'Repressed Alliance' => 2,
                                                'Calm Spirit' => 2,
                                                'Appraisal' => 2,
                                                'Specialist' => 2,
                                                'Do No Harm' => 2,
                                                'Shoulder The Burden' => 2,
                                                'Duty Of Care' => 2,

                                                // 1 Star Perks
                                                'This Is Not Happening' => 1,
                                                'Counterforce' => 1,
                                                'Low Profile' => 1,
                                                'Spine Chill' => 1,
                                                'Premonition' => 1,
                                                'Cut Loose' => 1,
                                                'Diversion' => 1,
                                                'Red Herring' => 1,
                                                'Friendly Competition' => 1,
                                                'Boon: Dark Theory' => 1,
                                                'Deadline' => 1,
                                                'Invocation: Weaving Spiders' => 1,
                                                'No-Mither' => 1,
                                                'Clean Break' => 1,
                                                'Invocation: Treacherous Crows' => 1,
                                                'Rapid Response' => 1,
                                            ];
                                            $perkName = isset($perks[$survivorName][$i]) ? $perks[$survivorName][$i] : '';
                                            $perkRating = isset($perkRatings[$perkName]) ? $perkRatings[$perkName] : 0;
                                        ?>
                                        <div class="perk-icon">
                                            <img src="images/perks/IconPerks_<?php echo strtolower(str_replace(['Boon: ', 'Teamwork: ', 'Invocation: ', ' ', '\'', '!', '&'], ['boon', 'teamwork', 'invocation', '', '', '', 'and'], $perkName)); ?>.webp" 
                                                 alt="<?php echo htmlspecialchars($perkName); ?>"
                                                 onerror="this.onerror=null; this.src='images/perks/IconPerks_<?php echo strtolower(str_replace(['Boon: ', 'Teamwork: ', 'Invocation: ', ' ', '\'', '!', '&'], ['boon', 'teamwork', 'invocation', '', '', '', 'and'], $perkName)); ?>.png'; this.onerror=function(){this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIyMCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGVyazwvdGV4dD48L3N2Zz4='}">
                                        </div>
                                        <div class="perk-name"><?php echo htmlspecialchars($perkName); ?></div>
                                        <div class="perk-rating">
                                            <div class="stars">
                                                <?php for ($star = 0; $star < 5; $star++): ?>
                                                    <span class="star <?php echo $star < $perkRating ? 'active' : ''; ?>">★</span>
                                                <?php endfor; ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endfor; ?>
                            </div>
                        </div>
                    <?php } ?>
                </div>

                <div class="universal-perks">
                    <h2>General Perks</h2>
                    <div class="perk-categories">
                        <div class="perk-category">
                            <div class="perk-grid">
                                <?php
                                $generalPerks = [
                                    'No One Left Behind',
                                    "We'll Make It",
                                    'Kindred',
                                    "Plunderer's Instinct",
                                    'Slippery Meat',
                                    'Deja Vu',
                                    'Hope',
                                    'Lightweight',
                                    'Resilience',
                                    'Small Game',
                                    'Spine Chill'
                                ];

                                foreach ($generalPerks as $perk) {
                                    $rating = isset($perkRatings[$perk]) ? $perkRatings[$perk] : 0;
                                    ?>
                                    <div class="perk-card" data-perk="<?php echo htmlspecialchars($perk); ?>">
                                        <div class="perk-icon">
                                            <img src="images/perks/IconPerks_<?php echo strtolower(str_replace(['Boon: ', 'Teamwork: ', 'Invocation: ', ' ', '\'', '!', '&'], ['boon', 'teamwork', 'invocation', '', '', '', 'and'], $perk)); ?>.webp"
                                                 alt="<?php echo htmlspecialchars($perk); ?>"
                                                 onerror="this.onerror=null; this.src='images/perks/IconPerks_<?php echo strtolower(str_replace(['Boon: ', 'Teamwork: ', 'Invocation: ', ' ', '\'', '!', '&'], ['boon', 'teamwork', 'invocation', '', '', '', 'and'], $perk)); ?>.png'; this.onerror=function(){this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIyMCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGVyazwvdGV4dD48L3N2Zz4='}">
                                        </div>
                                        <div class="perk-name"><?php echo htmlspecialchars($perk); ?></div>
                                        <div class="perk-rating">
                                            <div class="stars">
                                                <?php for ($star = 0; $star < 5; $star++): ?>
                                                    <span class="star <?php echo $star < $rating ? 'active' : ''; ?>">★</span>
                                                <?php endfor; ?>
                                            </div>
                                        </div>
                                    </div>
                                    <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="matches">
                <div class="match-tracking">
                    <div class="current-match">
                        <h2>Current Match Setup</h2>
                        <div class="match-setup">
                            <div class="setup-section">
                                <h3>Survivor</h3>
                                <select id="survivor-select">
                                    <option value="">No Survivor Selected</option>
                                    <?php foreach ($survivors as $survivor): 
                                        $rating = $SURVIVOR_RATINGS[$survivor] ?? 1;
                                        $stars = str_repeat('★', $rating) . str_repeat('☆', 3 - $rating);
                                    ?>
                                        <option value="<?php echo htmlspecialchars($survivor); ?>">
                                            <?php echo htmlspecialchars($survivor); ?> (<?php echo $stars; ?>)
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="setup-section">
                                <h3>Match Options</h3>
                                <div class="match-options">
                                    <div class="option-item">
                                        <div class="option-header">
                                            <span class="option-title">Revival Mode</span>
                                            <label class="toggle-switch">
                                                <input type="checkbox" id="revival-mode" onchange="toggleRevivalMode()">
                                                <span class="slider round"></span>
                                            </label>
                                        </div>
                                        <div class="option-description">Revive an eliminated survivor (Cost: 50% of survivor's rental price, rental price doubles after revival)</div>
                                    </div>
                                    <div class="option-item">
                                        <div class="option-header">
                                            <span class="option-title">Tunnel Insurance</span>
                                            <label class="toggle-switch">
                                                <input type="checkbox" id="tunnel-insurance" onchange="toggleTunnelInsurance()">
                                                <span class="slider round"></span>
                                            </label>
                                        </div>
                                        <div class="option-description">Protect against tunnel (Cost: $20, one-time use per rank, must be used in specific match)</div>
                                    </div>
                                </div>
                            </div>

                            <div class="setup-section" id="revival-section" style="display: none;">
                                <h3>Revive Survivor</h3>
                                <select id="revival-select">
                                    <option value="">Select Survivor to Revive</option>
                                    <?php foreach ($survivors as $survivor): ?>
                                        <option value="<?php echo htmlspecialchars($survivor); ?>"><?php echo htmlspecialchars($survivor); ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <div class="revival-cost">
                                    <span>Cost: </span>
                                    <span id="revival-cost-amount">0</span>
                                </div>
                                <div class="revival-note">Note: After revival, the survivor's rental price will be permanently doubled</div>
                            </div>

                            <div class="setup-section" id="tunnel-section" style="display: none;">
                                <h3>Tunnel Insurance Status</h3>
                                <div class="tunnel-status">
                                    <div class="cooldown-info">
                                        <span>Cooldown Matches: </span>
                                        <span id="tunnel-cooldown">0</span>
                                    </div>
                                    <div class="insurance-info">
                                        <span>Insurance Available: </span>
                                        <span id="insurance-available">Yes</span>
                                    </div>
                                    <div class="tunnel-note">Note: Must be used in the match it was purchased for. If not claimed, it is lost.</div>
                                </div>
                            </div>

                            <div class="setup-section">
                                <h3>Perks (1-4)</h3>
                                <div class="perk-selection">
                                    <?php 
                                    // Get all unique perks from the perks array and generalPerks
                                    $allPerks = [];
                                    foreach ($perks as $perkList) {
                                        foreach ($perkList as $perk) {
                                            $allPerks[$perk] = true;
                                        }
                                    }
                                    foreach ($generalPerks as $perk) {
                                        $allPerks[$perk] = true;
                                    }
                                    ksort($allPerks);
                                    ?>
                                    <?php for ($i = 0; $i < 4; $i++): ?>
                                        <div class="perk-option">
                                            <label for="perk-slot-<?php echo $i; ?>">Perk <?php echo $i + 1; ?></label>
                                            <select id="perk-slot-<?php echo $i; ?>" class="match-perk-select">
                                                <option value="">Select Perk</option>
                                                <?php foreach (array_keys($allPerks) as $perkName): ?>
                                                    <option value="<?php echo htmlspecialchars($perkName); ?>"><?php echo htmlspecialchars($perkName); ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>

                            <div class="setup-section">
                                <h3>Item</h3>
                                <select id="item-select" class="addon-rarity">
                                    <option value="">No Item</option>
                                    <option disabled>────────── Toolboxes ──────────</option>
                                    <option value="worn-out-toolbox" class="rarity-common">Worn-Out Toolbox (Common)</option>
                                    <option value="toolbox" class="rarity-uncommon">Toolbox (Uncommon)</option>
                                    <option value="commodious-toolbox" class="rarity-rare">Commodious Toolbox (Rare)</option>
                                    <option value="mechanics-toolbox" class="rarity-rare">Mechanic's Toolbox (Rare)</option>
                                    <option value="alexs-toolbox" class="rarity-very-rare">Alex's Toolbox (Very Rare)</option>
                                    <option value="engineers-toolbox" class="rarity-very-rare">Engineer's Toolbox (Very Rare)</option>
                                    <option disabled>────────── Med-Kits ──────────</option>
                                    <option value="camping-aid-kit" class="rarity-common">Camping Aid Kit (Common)</option>
                                    <option value="first-aid-kit" class="rarity-uncommon">First Aid Kit (Uncommon)</option>
                                    <option value="emergency-med-kit" class="rarity-rare">Emergency Med-Kit (Rare)</option>
                                    <option value="ranger-med-kit" class="rarity-very-rare">Ranger Med-Kit (Very Rare)</option>
                                    <option disabled>────────── Maps ──────────</option>
                                    <option value="map" class="rarity-rare">Map (Rare)</option>
                                    <option value="rainbow-map" class="rarity-visceral">Rainbow Map (Visceral)</option>
                                    <option disabled>────────── Keys ──────────</option>
                                    <option value="broken-key" class="rarity-rare">Broken Key (Rare)</option>
                                    <option value="dull-key" class="rarity-very-rare">Dull Key (Very Rare)</option>
                                    <option value="skeleton-key" class="rarity-visceral">Skeleton Key (Visceral)</option>
                                    <option disabled>────────── Flashlights ──────────</option>
                                    <option value="flashlight" class="rarity-uncommon">Flashlight (Uncommon)</option>
                                    <option value="sport-flashlight" class="rarity-rare">Sport Flashlight (Rare)</option>
                                    <option value="utility-flashlight" class="rarity-very-rare">Utility Flashlight (Very Rare)</option>
                                </select>
                            </div>

                            <div class="setup-section">
                                <h3>Item Add-ons</h3>
                                <div class="addon-selection">
                                    <div class="addon-slot">
                                        <label>Add-on 1</label>
                                        <select id="addon1-select" class="addon-rarity">
                                            <option value="">No Add-on</option>
                                            <option value="common" class="rarity-common">Common (Brown)</option>
                                            <option value="uncommon" class="rarity-uncommon">Uncommon (Green)</option>
                                            <option value="rare" class="rarity-rare">Rare (Blue)</option>
                                            <option value="very-rare" class="rarity-very-rare">Very Rare (Purple)</option>
                                            <option value="visceral" class="rarity-visceral">Visceral (Red)</option>
                                        </select>
                                    </div>
                                    <div class="addon-slot">
                                        <label>Add-on 2</label>
                                        <select id="addon2-select" class="addon-rarity">
                                            <option value="">No Add-on</option>
                                            <option value="common" class="rarity-common">Common (Brown)</option>
                                            <option value="uncommon" class="rarity-uncommon">Uncommon (Green)</option>
                                            <option value="rare" class="rarity-rare">Rare (Blue)</option>
                                            <option value="very-rare" class="rarity-very-rare">Very Rare (Purple)</option>
                                            <option value="visceral" class="rarity-visceral">Visceral (Red)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="setup-section">
                                <h3>Offering</h3>
                                <div class="offering-selection">
                                    <div class="offering-slot">
                                        <select id="offering-select" class="offering-rarity">
                                            <option value="">No Offering</option>
                                            <option value="common" class="rarity-common">Common (Brown)</option>
                                            <option value="uncommon" class="rarity-uncommon">Uncommon (Green)</option>
                                            <option value="rare" class="rarity-rare">Rare (Blue)</option>
                                            <option value="very-rare" class="rarity-very-rare">Very Rare (Purple)</option>
                                            <option value="visceral" class="rarity-visceral">Visceral (Red)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="setup-section match-results">
                                <h3>Match Results</h3>
                                <div class="results-grid">
                                    <div class="result-item">
                                        <label>Survivor Saves</label>
                                        <div class="counter">
                                            <button type="button" class="counter-btn minus">-</button>
                                            <input type="number" id="saves" value="0" min="0" max="8" readonly>
                                            <button type="button" class="counter-btn plus">+</button>
                                        </div>
                                        <div class="result-note">Max 8 saves</div>
                                    </div>
                                    <div class="result-item">
                                        <label>Generators Completed</label>
                                        <div class="counter">
                                            <button type="button" class="counter-btn minus">-</button>
                                            <input type="number" id="gens" value="0" min="0" max="5" readonly>
                                            <button type="button" class="counter-btn plus">+</button>
                                        </div>
                                        <div class="result-note">Must be the one to complete it</div>
                                    </div>
                                    <div class="result-item">
                                        <label>Stuns</label>
                                        <div class="counter">
                                            <button type="button" class="counter-btn minus">-</button>
                                            <input type="number" id="stuns" value="0" min="0" max="3" readonly>
                                            <button type="button" class="counter-btn plus">+</button>
                                        </div>
                                        <div class="result-note">Includes pallet stuns, flashlight saves, and Head On</div>
                                    </div>
                                    <div class="result-item">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="escaped" onchange="matchTracker.updateEscape()">
                                            <span class="slider round"></span>
                                            <span class="option-label">Escaped</span>
                                        </label>
                                        <div class="result-note">Both exit gates and hatch count</div>
                                    </div>
                                    <div class="result-item">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="hatch-closed" onchange="matchTracker.updateHatchClosed()">
                                            <span class="slider round"></span>
                                            <span class="option-label">Hatch Closed</span>
                                        </label>
                                        <div class="result-note">+$10 bonus if escaping after hatch closed</div>
                                    </div>
                                    <div class="result-item">
                                        <label>Pips Earned</label>
                                        <div class="counter">
                                            <button type="button" class="counter-btn minus">-</button>
                                            <input type="number" id="pips" value="0" min="-2" max="2" readonly>
                                            <button type="button" class="counter-btn plus">+</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="match-summary">
                                    <h4>Match Summary</h4>
                                    <div class="summary-content">
                                        <div class="summary-item">
                                            <span>Total Earnings:</span>
                                            <span id="total-earnings">$0</span>
                                        </div>
                                        <div class="summary-item">
                                            <span>Loadout Cost:</span>
                                            <span id="loadout-cost">$0</span>
                                        </div>
                                        <div class="summary-item total">
                                            <span>Net Profit:</span>
                                            <span id="net-profit">$0</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="save-match-btn" onclick="saveMatchResults()">Save Match Results</button>
                            </div>
                        </div>
                    </div>

                    <div class="rank-progress">
                        <h2>Rank Progress</h2>
                        <div class="rank-display">
                            <div class="rank ash">
                                <span class="rank-name">Ash</span>
                                <div class="rank-levels">
                                    <?php for ($i = 4; $i >= 1; $i--): ?>
                                        <div class="rank-level <?php echo $i === 4 ? 'current' : ''; ?>" data-rank="ash-<?php echo $i; ?>">
                                            <span class="level-number"><?php echo $i; ?></span>
                                            <div class="pip-progress">
                                                <div class="pip" data-pip="1"></div>
                                                <div class="pip" data-pip="2"></div>
                                                <div class="pip" data-pip="3"></div>
                                                <?php if ($i <= 2): ?>
                                                    <div class="pip" data-pip="4"></div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>
                            <div class="rank silver">
                                <span class="rank-name">Silver</span>
                                <div class="rank-levels">
                                    <?php for ($i = 4; $i >= 1; $i--): ?>
                                        <div class="rank-level" data-rank="silver-<?php echo $i; ?>">
                                            <span class="level-number"><?php echo $i; ?></span>
                                            <div class="pip-progress">
                                                <div class="pip" data-pip="1"></div>
                                                <div class="pip" data-pip="2"></div>
                                                <div class="pip" data-pip="3"></div>
                                                <div class="pip" data-pip="4"></div>
                                                <div class="pip" data-pip="5"></div>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>
                            <div class="rank gold">
                                <span class="rank-name">Gold</span>
                                <div class="rank-levels">
                                    <?php for ($i = 4; $i >= 1; $i--): ?>
                                        <div class="rank-level" data-rank="gold-<?php echo $i; ?>">
                                            <span class="level-number"><?php echo $i; ?></span>
                                            <div class="pip-progress">
                                                <div class="pip" data-pip="1"></div>
                                                <div class="pip" data-pip="2"></div>
                                                <div class="pip" data-pip="3"></div>
                                                <div class="pip" data-pip="4"></div>
                                                <div class="pip" data-pip="5"></div>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>
                            <div class="rank iri">
                                <span class="rank-name">Iridescent</span>
                                <div class="rank-levels">
                                    <?php for ($i = 4; $i >= 1; $i--): ?>
                                        <div class="rank-level" data-rank="iri-<?php echo $i; ?>">
                                            <span class="level-number"><?php echo $i; ?></span>
                                            <div class="pip-progress">
                                                <?php if ($i > 1): ?>
                                                    <div class="pip" data-pip="1"></div>
                                                    <div class="pip" data-pip="2"></div>
                                                    <div class="pip" data-pip="3"></div>
                                                    <div class="pip" data-pip="4"></div>
                                                    <div class="pip" data-pip="5"></div>
                                                <?php else: ?>
                                                    <div class="pip iri-1">IRI 1</div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    <?php endfor; ?>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="match-history">
                        <h2>Match History</h2>
                        <div class="data-management">
                            <button type="button" class="data-btn export-btn" onclick="exportData()">Export Data</button>
                            <label class="data-btn import-btn">
                                Import Data
                                <input type="file" id="import-file" accept=".json" onchange="importData(this)" style="display: none;">
                            </label>
                        </div>
                        <div class="progress-summary">
                            <div class="progress-item">
                                <span class="progress-label">Total Matches</span>
                                <span class="progress-value" id="total-matches">0</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">Total Earnings</span>
                                <span class="progress-value" id="total-earnings-history">0</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">Current Rank</span>
                                <span class="progress-value" id="current-rank">Ash IV</span>
                            </div>
                            <div class="progress-item">
                                <span class="progress-label">Pips</span>
                                <span class="progress-value" id="current-pips">0/3</span>
                            </div>
                        </div>
                        <div class="match-filters">
                            <select id="match-filter">
                                <option value="all">All Matches</option>
                                <option value="escaped">Escaped Matches</option>
                                <option value="died">Died Matches</option>
                            </select>
                            <select id="sort-matches">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Earnings</option>
                                <option value="lowest">Lowest Earnings</option>
                            </select>
                        </div>
                        <div class="match-list" id="match-list">
                            <!-- Match history will be populated here -->
                        </div>
                        <div class="pagination">
                            <button type="button" id="prev-page" class="pagination-btn">Previous</button>
                            <span id="page-info">Page 1 of 1</span>
                            <button type="button" id="next-page" class="pagination-btn">Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="credits">
                <div class="credits-container">
                    <h2>Credits & Acknowledgments</h2>
                    <div class="credits-section">
                        <h3>Inspiration & Data Sources</h3>
                        <div class="credit-item">
                            <h4>Otzdarva</h4>
                            <p>The perk ratings and tier system used in this project are based on Otzdarva's comprehensive ranking system. Their detailed analysis and insights into perk effectiveness have been invaluable in creating a balanced and accurate representation of survivor perks.</p>
                        </div>
                        <div class="credit-item">
                            <h4>SpookyLoopz</h4>
                            <p>This project was inspired by SpookyLoopz's Killer Hardcore Challenge. Their innovative approach to creating engaging Dead by Daylight challenges motivated the creation of this survivor-focused version.</p>
                        </div>
                        <div class="credit-item">
                            <h4>Dead by Daylight Wiki</h4>
                            <p>The official Dead by Daylight Wiki (<a href="https://deadbydaylight.wiki.gg/" target="_blank">deadbydaylight.wiki.gg</a>) has been an invaluable resource, providing easy access to perk images and comprehensive documentation of the game's mechanics and content.</p>
                        </div>
                        <div class="credit-item">
                            <h4>Behaviour Interactive</h4>
                            <p>Behaviour Interactive (BHVR) for creating and maintaining Dead by Daylight. All rights pertaining to Dead by Daylight, including its characters, perks, and other game elements, belong to Behaviour Interactive.</p>
                        </div>
                    </div>
                    <div class="credits-section">
                        <h3>About This Project</h3>
                        <p>The Hardcore Survivor Challenge is a fan-made project created to provide an engaging and challenging way to experience Dead by Daylight from the survivor perspective. It combines strategic loadout choices with performance tracking to create a unique gameplay experience.</p>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="rules">
                <?php include 'partials/rules.php'; ?>
            </div>
        </div>
    </form>

    <script src="js/main.js"></script>
    <script src="js/match-tracker.js"></script>
</body>
</html>
<?php include 'partials/footer.php'; ?> 