// Match tracking functionality
class MatchTracker {
    constructor() {
        this.currentMatch = {
            survivor: '',
            perks: [],
            offerings: [],
            results: {
                gens: 0,
                saves: 0,
                stuns: 0,
                escaped: false,
                hatchClosed: false,
                pips: 0
            },
            options: {
                revivalMode: false,
                tunnelInsurance: false
            }
        };
        
        this.matchHistory = [];
        this.loadMatchHistory();
        this.loadBankBalance();

        // Add price cheatsheet to match setup
        this.addPriceCheatsheet();

        // Add New Run button
        this.addNewRunButton();

        // Add bank balance display
        this.addBankBalanceDisplay();

        // Add event listener for survivor selection
        const survivorSelect = document.getElementById('survivor-select');
        if (survivorSelect) {
            survivorSelect.addEventListener('change', () => {
                this.updateMatchSummary();
                this.checkRevivalModeAvailability();
                this.updatePerkOptions(); // Ensure perk options update on survivor change
            });
        }

        // Add event listener for revival select
        const revivalSelect = document.getElementById('revival-select');
        if (revivalSelect) {
            revivalSelect.addEventListener('change', () => {
                const selectedSurvivor = revivalSelect.value;
                const revivalCostAmount = document.getElementById('revival-cost-amount');
                if (selectedSurvivor) {
                    const survivorCard = document.querySelector(`.survivor-card[data-survivor="${selectedSurvivor}"]`);
                    if (survivorCard) {
                        const rentalPrice = this.getSurvivorCost(selectedSurvivor);
                        const revivalCost = Math.floor(rentalPrice * 0.5); // 50% of rental price
                        revivalCostAmount.textContent = `$${revivalCost}`;
                    }
                } else {
                    revivalCostAmount.textContent = '$0';
                }
                this.updateMatchSummary();
            });
        }

        // Add event listener for revival mode toggle
        const revivalModeToggle = document.getElementById('revival-mode');
        if (revivalModeToggle) {
            revivalModeToggle.addEventListener('change', () => {
                this.currentMatch.options.revivalMode = revivalModeToggle.checked;
                this.updateMatchSummary();
            });
        }

        // Add CSS for duplicate perks
        const style = document.createElement('style');
        style.textContent = `
            select.match-perk-select option[disabled] {
                color: #ff6b6b !important;
                font-style: italic !important;
                background-color: #2a2a2a !important;
            }
            select.match-perk-select option[disabled]::before {
                content: "⚠️ ";
            }
        `;
        document.head.appendChild(style);

        // Update perk select dropdowns with ratings and duplicate status
        for (let i = 0; i < 4; i++) {
            const perkSelect = document.getElementById(`perk-slot-${i}`);
            if (perkSelect) {
                // Store original options
                const options = Array.from(perkSelect.options);
                
                // Clear the select
                perkSelect.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select Perk';
                perkSelect.appendChild(defaultOption);
                
                // Add options with ratings and duplicate status
                options.forEach(option => {
                    if (option.value) {
                        const rating = this.getPerkRating(option.value);
                        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                        const newOption = document.createElement('option');
                        newOption.value = option.value;
                        newOption.textContent = `${option.value} (${stars})`;
                        
                        // Check if this perk is already selected in another slot
                        const isDuplicate = Array.from(document.querySelectorAll('.match-perk-select'))
                            .some(select => select !== perkSelect && select.value === option.value);
                        
                        if (isDuplicate) {
                            newOption.disabled = true;
                        }
                        
                        perkSelect.appendChild(newOption);
                    }
                });

                // Add change event listener to update duplicate status
                perkSelect.addEventListener('change', () => {
                    this.updatePerkOptions();
                });
            }
        }

        // Initial checks
        this.disableEliminatedSurvivors();
        this.checkRevivalModeAvailability();

        // Add observer to watch for changes in survivor cards
        const observer = new MutationObserver(() => {
            this.disableEliminatedSurvivors();
            this.checkRevivalModeAvailability();
        });

        // Observe all survivor cards for changes
        document.querySelectorAll('.survivor-card').forEach(card => {
            observer.observe(card, {
                attributes: true,
                attributeFilter: ['class', 'data-has-been-revived']
            });
        });

        // Add sell buttons to all survivor cards
        document.querySelectorAll('.survivor-card').forEach(card => {
            this.addSellButton(card);
        });

        // Add observer to watch for new survivor cards
        const observerNew = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('survivor-card')) {
                        this.addSellButton(node);
                    }
                });
            });
        });

        // Observe the survivor grid for new cards
        const survivorGrid = document.querySelector('.survivor-grid');
        if (survivorGrid) {
            observerNew.observe(survivorGrid, {
                childList: true,
                subtree: true
            });
        }

        this.currentPips = parseInt(localStorage.getItem('currentPips')) || 0;
        this.currentRank = localStorage.getItem('currentRank') || 'Ash IV';
        this.updateRankProgressDisplay();
        this.updateSummaryBarPipsAndRank();
        this.perkUsage = JSON.parse(localStorage.getItem('perkUsage') || '{}');
        this.perkHistory = JSON.parse(localStorage.getItem('perkHistory') || '{}'); // {survivor: [array of perk arrays]}
        this.updatePerkOptions();
    }

    // Load match history from localStorage
    loadMatchHistory() {
        const savedHistory = localStorage.getItem('matchHistory');
        if (savedHistory) {
            this.matchHistory = JSON.parse(savedHistory);
        }
    }

    // Save match history to localStorage
    saveMatchHistory() {
        localStorage.setItem('matchHistory', JSON.stringify(this.matchHistory));
    }

    // Load bank balance from localStorage
    loadBankBalance() {
        const savedBalance = localStorage.getItem('bankBalance');
        this.bankBalance = savedBalance ? parseFloat(savedBalance) : 250; // Start with $250
    }

    // Save bank balance to localStorage
    saveBankBalance() {
        localStorage.setItem('bankBalance', this.bankBalance.toString());
    }

    // Calculate earnings based on match results
    calculateEarnings() {
        let earnings = 0;
        const results = this.currentMatch.results;

        // Generator completion rewards
        if (results.gens > 0) {
            earnings += 8; // Base reward for first gen
            if (results.gens > 1) {
                // Additional $2 per gen, max +$8
                earnings += Math.min((results.gens - 1) * 2, 8);
            }
        }

        // Safe unhook rewards
        if (results.saves > 0) {
            // Base $10 per save, no limit
            earnings += results.saves * 10;
            // TODO: Add +$5 bonus if unhooked survivor escapes
        }

        // Stun rewards
        if (results.stuns > 0) {
            // Base $12 for first stun
            earnings += 12;
            // Additional $4 per stun, max +$8
            if (results.stuns > 1) {
                earnings += Math.min((results.stuns - 1) * 4, 8);
            }
        }

        // Escape reward
        if (results.escaped) {
            earnings += 15; // Base escape reward
            if (results.hatchClosed) {
                earnings += 10; // Bonus for escaping after hatch closed
            }
        }

        return earnings;
    }

    // Get survivor rental cost
    getSurvivorCost(survivor) {
        const SURVIVOR_RATINGS = {
            'Dwight': 3, 'Meg': 3, 'Claudette': 2, 'Jake': 2, 'Nea': 2, 'David': 2, 'Bill': 2, 'Ace': 1,
            'Feng': 3, 'Laurie': 2, 'Quentin': 2, 'Tapp': 2, 'Kate': 3, 'Adam': 2, 'Jeff': 2, 'Jane': 2,
            'Ash': 1, 'Steve': 2, 'Nancy': 2, 'Yui': 2, 'Zarina': 3, 'Cheryl': 1, 'Felix': 2, 'Elodie': 1,
            'Yun-Jin': 1, 'Jill': 2, 'Leon': 1, 'Mikaela': 2, 'Jonah': 2, 'Yoichi': 1, 'Haddie': 1, 'Ada': 2,
            'Rebecca': 2, 'Vittorio': 2, 'Thalita': 1, 'Renato': 1, 'Gabriel': 2, 'Nicolas Cage': 1,
            'Ellen Ripley': 1, 'Alan Wake': 1, 'Sable': 2, 'The Troupe': 1, 'Lara Croft': 2, 'Trevor Belmont': 2,
            'Taurie': 1, 'Orela': 1
        };

        const RANK_COSTS = {
            'ash': { 1: 5, 2: 10, 3: 15 },
            'bronze': { 1: 10, 2: 15, 3: 20 },
            'silver': { 1: 15, 2: 20, 3: 25 },
            'gold': { 1: 20, 2: 25, 3: 30 },
            'iri': { 1: 25, 2: 30, 3: 35 }
        };

        const rating = SURVIVOR_RATINGS[survivor] || 1;
        const currentRank = this.getCurrentRank(); // TODO: Implement rank tracking
        const rankCosts = RANK_COSTS[currentRank] || RANK_COSTS['ash'];
        
        return rankCosts[rating] || rankCosts[1];
    }

    // Get perk cost
    getPerkCost(perk) {
        const PERK_RATINGS = {
            // 5 Star Perks
            'Decisive Strike': 5, 'Off The Record': 5, 'Resurgence': 5, 'Unbreakable': 5, 'Deliverance': 5,
            // 4 Star Perks
            'Windows Of Opportunity': 4, 'Deja Vu': 4, 'Wicked': 4, 'Lithe': 4, 'Sprint Burst': 4,
            'Dead Hard': 4, 'Kindred': 4, 'Quick Gambit': 4, 'Bond': 4, 'Adrenaline': 4,
            'Reassurance': 4, 'Babysitter': 4, 'Resilience': 4, 'Balanced Landing': 4, 'Flip-Flop': 4,
            'Power Struggle': 4, "We're Gonna Live Forever": 4, 'Made For This': 4, 'Finesse': 4,
            'Hope': 4, 'Built To Last': 4, 'For The People': 4,
            // 3 Star Perks
            'Dramaturgy': 3, 'Overcome': 3, 'Blood Rush': 3, 'Saboteur': 3, 'Wiretap': 3,
            'Head On': 3, 'Slippery Meat': 3, 'Up The Ante': 3, 'Distortion': 3, 'Plot Twist': 3,
            'Strength In Shadows': 3, 'Reactive Healing': 3, 'Second Wind': 3, "We'll Make It": 3,
            'No One Left Behind': 3, 'Borrowed Time': 3, 'Background Player': 3, 'Poised': 3,
            'Open-Handed': 3, 'Aftercare': 3, 'Empathy': 3, 'Alert': 3, 'Inner Focus': 3,
            'Fogwise': 3, 'Any Means Necessary': 3, 'Lucky Break': 3, 'Camaraderie': 3,
            'Iron Will': 3, 'Soul Guard': 3, 'Buckle Up': 3, 'Prove Thy Self': 3,
            'Streetwise': 3, 'Boon: Circle Of Healing': 3, 'Botany Knowledge': 3,
            'Empathetic Connection': 3, 'Self-Care': 3, 'Inner Strength': 3, 'Troubleshooter': 3,
            'Blast Mine': 3, 'Hyperfocus': 3, 'Stake Out': 3, 'Boon: Exponential': 3,
            'Boon: Shadow Step': 3, 'Champion Of Light': 3, 'Fixated': 3, 'Vigil': 3,
            // 2 Star Perks
            'Mettle Of Man': 2, 'Detectives Hunch': 2, 'Breakdown': 2, 'Wake Up': 2,
            'Moment Of Glory': 2, 'Pharmacy': 2, 'Eyes Of Belmont': 2, 'Object Of Obsession': 2,
            'Desperate Measures': 2, 'Leader': 2, 'Sole Survivor': 2, 'Smash Hit': 2,
            'Chemical Trap': 2, 'Flashbang': 2, 'Parental Guidance': 2, 'Scavenger': 2,
            'Clairvoyance': 2, 'Tenacity': 2, 'Teamwork: Power Of Two': 2, 'Left Behind': 2,
            'Visionary': 2, 'Lucky Star': 2, 'Dark Sense': 2, 'Still Sight': 2,
            'Blood Pact': 2, 'Lightweight': 2, 'Better Together': 2, 'Small Game': 2,
            'Boon: Illumination': 2, 'Exultation': 2, 'Overzealous': 2, 'Solidarity': 2,
            'Corrective Action': 2, 'Bardic Inspiration': 2, 'Quick & Quiet': 2,
            'Boil Over': 2, 'Breakout': 2, 'Self-Preservation': 2, 'Light-Footed': 2,
            'Urban Evasion': 2, 'Potential Energy': 2, 'Rookie Spirit': 2, 'Hardened': 2,
            "Plunderer's Instinct": 2, 'Residual Manifest': 2, 'Teamwork: Collective Stealth': 2,
            'Dance With Me': 2, 'Deception': 2, 'Bite The Bullet': 2, 'Scene Partner': 2,
            'Better Than New': 2, 'Autodidact': 2, 'Mirrored Illusion': 2, 'Fast Track': 2,
            'Ace In The Hole': 2, 'Technician': 2, 'Repressed Alliance': 2, 'Calm Spirit': 2,
            'Appraisal': 2, 'Specialist': 2, 'Do No Harm': 2, 'Shoulder The Burden': 2,
            'Duty Of Care': 2,
            // 1 Star Perks
            'This Is Not Happening': 1, 'Counterforce': 1, 'Low Profile': 1, 'Spine Chill': 1,
            'Premonition': 1, 'Cut Loose': 1, 'Diversion': 1, 'Red Herring': 1,
            'Friendly Competition': 1, 'Boon: Dark Theory': 1, 'Deadline': 1,
            'Invocation: Weaving Spiders': 1, 'No-Mither': 1, 'Clean Break': 1,
            'Invocation: Treacherous Crows': 1, 'Rapid Response': 1
        };

        const RANK_COSTS = {
            'ash': { 1: 2, 2: 3, 3: 4, 4: 6, 5: 8 },
            'bronze': { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 },
            'silver': { 1: 4, 2: 5, 3: 8, 4: 10, 5: 12 },
            'gold': { 1: 5, 2: 6, 3: 10, 4: 12, 5: 14 },
            'iri': { 1: 6, 2: 8, 3: 12, 4: 14, 5: 16 }
        };

        const rating = PERK_RATINGS[perk] || 1;
        const currentRank = this.getCurrentRank(); // TODO: Implement rank tracking
        const rankCosts = RANK_COSTS[currentRank] || RANK_COSTS['ash'];
        
        return rankCosts[rating] || rankCosts[1];
    }

    // Get item and add-on cost
    getItemCost(item, rarity) {
        const RANK_COSTS = {
            'ash': { 'rarity-common': 1, 'rarity-uncommon': 2, 'rarity-rare': 4, 'rarity-very-rare': 6, 'rarity-visceral': 10 },
            'bronze': { 'rarity-common': 2, 'rarity-uncommon': 3, 'rarity-rare': 5, 'rarity-very-rare': 7, 'rarity-visceral': 11 },
            'silver': { 'rarity-common': 3, 'rarity-uncommon': 4, 'rarity-rare': 6, 'rarity-very-rare': 8, 'rarity-visceral': 12 },
            'gold': { 'rarity-common': 4, 'rarity-uncommon': 5, 'rarity-rare': 7, 'rarity-very-rare': 9, 'rarity-visceral': 13 },
            'iri': { 'rarity-common': 5, 'rarity-uncommon': 6, 'rarity-rare': 8, 'rarity-very-rare': 10, 'rarity-visceral': 14 }
        };

        const currentRank = this.getCurrentRank(); // TODO: Implement rank tracking
        const rankCosts = RANK_COSTS[currentRank] || RANK_COSTS['ash'];
        
        return rankCosts[rarity] || 0;
    }

    // Get offering cost
    getOfferingCost(offering) {
        return this.getItemCost(offering, offering.rarity);
    }

    // Get current rank (placeholder - needs to be implemented)
    getCurrentRank() {
        // TODO: Implement rank tracking
        return 'ash';
    }

    // Calculate loadout cost
    calculateLoadoutCost() {
        let cost = 0;
        
        // Add survivor rental cost
        const survivorSelect = document.getElementById('survivor-select');
        if (survivorSelect && survivorSelect.value) {
            cost += this.getSurvivorCost(survivorSelect.value);
        }

        // Add perk costs
        for (let i = 0; i < 4; i++) {
            const perkSelect = document.getElementById(`perk-slot-${i}`);
            if (perkSelect && perkSelect.value) {
                cost += this.getPerkCost(perkSelect.value);
            }
        }

        // Add item cost
        const itemSelect = document.getElementById('item-select');
        if (itemSelect && itemSelect.value) {
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const rarity = selectedOption.className.split(' ').find(cls => cls.startsWith('rarity-'));
            if (rarity) {
                cost += this.getItemCost(itemSelect.value, rarity);
            }
        }

        // Add add-on costs
        const addon1Select = document.getElementById('addon1-select');
        const addon2Select = document.getElementById('addon2-select');
        if (addon1Select && addon1Select.value) {
            const selectedOption = addon1Select.options[addon1Select.selectedIndex];
            const rarity = selectedOption.className.split(' ').find(cls => cls.startsWith('rarity-'));
            if (rarity) {
                cost += this.getItemCost(addon1Select.value, rarity);
            }
        }
        if (addon2Select && addon2Select.value) {
            const selectedOption = addon2Select.options[addon2Select.selectedIndex];
            const rarity = selectedOption.className.split(' ').find(cls => cls.startsWith('rarity-'));
            if (rarity) {
                cost += this.getItemCost(addon2Select.value, rarity);
            }
        }

        // Add offering cost
        const offeringSelect = document.getElementById('offering-select');
        if (offeringSelect && offeringSelect.value) {
            const selectedOption = offeringSelect.options[offeringSelect.selectedIndex];
            const rarity = selectedOption.className.split(' ').find(cls => cls.startsWith('rarity-'));
            if (rarity) {
                cost += this.getItemCost(offeringSelect.value, rarity);
            }
        }

        // Add tunnel insurance cost if selected
        const tunnelInsurance = document.getElementById('tunnel-insurance');
        if (tunnelInsurance && tunnelInsurance.checked) {
            cost += 20;
        }

        // Add revival cost if Revival Mode is enabled and a survivor is selected
        const revivalMode = document.getElementById('revival-mode');
        const revivalSelect = document.getElementById('revival-select');
        if (revivalMode && revivalMode.checked && revivalSelect && revivalSelect.value) {
            const selectedSurvivor = revivalSelect.value;
            const survivorCard = document.querySelector(`.survivor-card[data-survivor="${selectedSurvivor}"]`);
            if (survivorCard && survivorCard.classList.contains('eliminated') && !survivorCard.classList.contains('revived')) {
                const rentalPrice = this.getSurvivorCost(selectedSurvivor);
                const revivalCost = Math.floor(rentalPrice * 0.5); // 50% of rental price
                cost += revivalCost;
            }
        }

        return cost;
    }

    // Save match results
    saveMatchResults() {
        const match = {
            ...this.currentMatch,
            date: new Date().toISOString(),
            earnings: this.calculateEarnings(),
            loadoutCost: this.calculateLoadoutCost()
        };

        // --- NEW: Track perk usage for unlocks ---
        if (match.survivor && match.perks && match.perks.length) {
            const survivor = match.survivor;
            const survivorPerks = this.getSurvivorUniquePerks(survivor);
            match.perks.forEach(perk => {
                if (survivorPerks.includes(perk)) {
                    if (!this.perkUsage[survivor]) this.perkUsage[survivor] = {};
                    if (!this.perkUsage[survivor][perk]) this.perkUsage[survivor][perk] = 0;
                    this.perkUsage[survivor][perk]++;
                }
            });
            localStorage.setItem('perkUsage', JSON.stringify(this.perkUsage));

            // --- NEW: Track perk usage history for cooldowns ---
            if (!this.perkHistory[survivor]) this.perkHistory[survivor] = [];
            this.perkHistory[survivor].unshift(match.perks.slice()); // add this match's perks to the front
            if (this.perkHistory[survivor].length > 10) this.perkHistory[survivor].length = 10; // keep last 10 matches
            localStorage.setItem('perkHistory', JSON.stringify(this.perkHistory));
            // --- END NEW ---
        }
        // --- END NEW ---

        // Update bank balance
        this.bankBalance += match.earnings - match.loadoutCost;
        this.saveBankBalance();
        this.updateBankBalanceDisplay();
        
        // Handle revival if enabled and a survivor is selected
        const revivalMode = document.getElementById('revival-mode');
        const revivalSelect = document.getElementById('revival-select');
        if (revivalMode && revivalMode.checked && revivalSelect && revivalSelect.value) {
            const selectedSurvivor = revivalSelect.value;
            const survivorCard = document.querySelector(`.survivor-card[data-survivor="${selectedSurvivor}"]`);
            if (survivorCard && survivorCard.classList.contains('eliminated') && !survivorCard.classList.contains('revived')) {
                // Revive the survivor
                survivorCard.classList.remove('eliminated');
                survivorCard.classList.add('revived');
                survivorCard.setAttribute('data-has-been-revived', 'true');
                
                // Set lives to 1
                const lives = survivorCard.querySelectorAll('.life');
                lives.forEach((life, index) => {
                    life.classList.toggle('active', index === 0);
                });
                
                // Update the match data to include revival info
                match.revival = {
                    survivor: selectedSurvivor,
                    cost: Math.floor(this.getSurvivorCost(selectedSurvivor) * 0.5)
                };
            }
        }
        
        // --- NEW: Update pips and rank ---
        this.updatePipsAndRank(match.results.pips);
        this.updateRankProgressDisplay();
        this.updateSummaryBarPipsAndRank();
        // --- END NEW ---

        this.matchHistory.unshift(match);
        this.saveMatchHistory();
        this.resetCurrentMatch();
        this.updateMatchSummary();
        this.updateMatchHistory();
        
        // Update the UI after revival
        if (typeof window.matchTracker !== 'undefined') {
            window.matchTracker.checkRevivalModeAvailability();
        }
        this.updatePerkOptions();
    }

    // --- NEW: Check if a perk is on cooldown for a survivor ---
    isPerkOnCooldownForSurvivor(perk, survivor) {
        // General perks always use cooldown
        const generalPerks = [
            'No One Left Behind', "We'll Make It", 'Kindred', "Plunderer's Instinct", 'Slippery Meat', 'Deja Vu', 'Hope', 'Lightweight', 'Resilience', 'Small Game', 'Spine Chill'
        ];
        const isGeneral = generalPerks.includes(perk);
        const isUnique = this.getSurvivorUniquePerks(survivor).includes(perk);
        // Unique perks: only use cooldown if unlocked
        if (isUnique && !(this.perkUsage[survivor] && this.perkUsage[survivor][perk] >= 6)) {
            return false; // not unlocked yet, exempt from cooldown
        }
        // Get perk usage history for this survivor
        const history = this.perkHistory[survivor] || [];
        // Check last 3 matches for consecutive use
        let usedInRow = 0;
        for (let i = 0; i < Math.min(3, history.length); i++) {
            if (history[i].includes(perk)) usedInRow++;
            else break;
        }
        if (usedInRow >= 3) {
            // Check if on cooldown (next 2 matches after 3 uses)
            // Find last streak of 3 uses in a row
            let streakEnd = 0;
            for (let i = 0; i < history.length; i++) {
                if (history[i].includes(perk)) streakEnd++;
                else break;
            }
            // If the last 3 matches were the streak, then matches 4 and 5 are cooldown
            if (streakEnd >= 3) {
                // If the perk was used in matches 4 or 5, it's not available
                for (let j = 3; j < 5; j++) {
                    if (history[j] && history[j].includes(perk)) return true;
                }
                // If we're in the cooldown window (less than 2 matches since streak), it's on cooldown
                if (history.length < 5 && streakEnd === history.length) return true;
                if (history.length >= 3 && streakEnd === 3) return true;
            }
        }
        return false;
    }

    // --- MODIFIED: Update perk dropdowns to enforce unlocks and cooldowns ---
    updatePerkOptions() {
        const perkSelects = document.querySelectorAll('.match-perk-select');
        const selectedSurvivor = document.getElementById('survivor-select')?.value;
        const selectedPerks = Array.from(perkSelects).map(select => select.value);
        perkSelects.forEach(select => {
            // Store the current value
            const currentValue = select.value;
            // Rebuild the options list to ensure all logic is applied
            const allOptions = Array.from(select.options).map(opt => opt.value).filter(Boolean);
            // Remove all options except the first (placeholder)
            while (select.options.length > 1) select.remove(1);
            // Add options with unlock/cooldown/duplicate logic
            allOptions.forEach(optionValue => {
                // Disable if duplicate
                const isDuplicate = selectedPerks.filter(perk => perk === optionValue).length > 1;
                let isUnlocked = true;
                let isCooldown = false;
                if (selectedSurvivor) {
                    isUnlocked = this.isPerkUnlockedForSurvivor(optionValue, selectedSurvivor);
                    isCooldown = this.isPerkOnCooldownForSurvivor(optionValue, selectedSurvivor);
                }
                // Only add if not duplicate, unlocked, and not on cooldown
                if (!isDuplicate && isUnlocked && !isCooldown) {
                    const option = document.createElement('option');
                    option.value = optionValue;
                    option.textContent = optionValue;
                    select.appendChild(option);
                }
            });
            // Restore the previous value if still valid
            select.value = currentValue;
        });
    }

    // Reset current match data
    resetCurrentMatch() {
        this.currentMatch = {
            survivor: '',
            perks: [],
            offerings: [],
            results: {
                gens: 0,
                saves: 0,
                stuns: 0,
                escaped: false,
                hatchClosed: false,
                pips: 0
            },
            options: {
                revivalMode: false,
                tunnelInsurance: false
            }
        };
        
        // Reset all input values
        document.getElementById('gens').value = '0';
        document.getElementById('saves').value = '0';
        document.getElementById('stuns').value = '0';
        document.getElementById('pips').value = '0';
        document.getElementById('escaped').checked = false;
        document.getElementById('hatch-closed').checked = false;

        // Reset all selectors
        document.getElementById('survivor-select').value = '';
        document.getElementById('revival-mode').checked = false;
        document.getElementById('tunnel-insurance').checked = false;
        document.getElementById('revival-select').value = '';
        document.getElementById('item-select').value = '';
        document.getElementById('addon1-select').value = '';
        document.getElementById('addon2-select').value = '';
        document.getElementById('offering-select').value = '';
        
        // Reset perk slots
        for (let i = 0; i < 4; i++) {
            document.getElementById(`perk-slot-${i}`).value = '';
        }

        // Update UI
        this.updateMatchSummary();
        this.checkRevivalModeAvailability();
    }

    // Update match result counter
    updateCounter(type, value) {
        const results = this.currentMatch.results;
        const input = document.getElementById(type);
        
        switch (type) {
            case 'gens':
                results.gens = Math.max(0, Math.min(5, results.gens + value));
                input.value = results.gens;
                break;
            case 'saves':
                results.saves = Math.max(0, Math.min(8, results.saves + value));
                input.value = results.saves;
                break;
            case 'stuns':
                results.stuns = Math.max(0, Math.min(3, results.stuns + value));
                input.value = results.stuns;
                break;
            case 'pips':
                results.pips = Math.max(0, Math.min(2, results.pips + value));
                input.value = results.pips;
                break;
        }
        // Defensive: if input.value is negative, reset to 0
        if (parseInt(input.value) < 0) {
            input.value = 0;
        }
        
        this.updateMatchSummary();
    }

    // Update escape status
    updateEscape() {
        const escapedCheckbox = document.getElementById('escaped');
        this.currentMatch.results.escaped = escapedCheckbox.checked;
        this.updateMatchSummary();
    }

    // Update hatch closed status
    updateHatchClosed() {
        const hatchClosedCheckbox = document.getElementById('hatch-closed');
        this.currentMatch.results.hatchClosed = hatchClosedCheckbox.checked;
        this.updateMatchSummary();
    }

    // Update match summary display
    updateMatchSummary() {
        const earnings = this.calculateEarnings();
        const loadoutCost = this.calculateLoadoutCost();
        const netProfit = earnings - loadoutCost;
        const projectedBalance = this.bankBalance + netProfit;

        // Format numbers as currency
        const formatCurrency = (amount) => {
            return `$${amount.toFixed(0)}`;
        };

        document.getElementById('total-earnings').textContent = formatCurrency(earnings);
        document.getElementById('loadout-cost').textContent = formatCurrency(loadoutCost);
        document.getElementById('net-profit').textContent = formatCurrency(netProfit);

        // Add projected balance to the summary
        const summaryContent = document.querySelector('.summary-content');
        if (summaryContent) {
            let projectedBalanceItem = summaryContent.querySelector('.projected-balance');
            if (!projectedBalanceItem) {
                projectedBalanceItem = document.createElement('div');
                projectedBalanceItem.className = 'summary-item projected-balance';
                summaryContent.insertBefore(projectedBalanceItem, summaryContent.querySelector('.total'));
            }
            projectedBalanceItem.innerHTML = `
                <span>Projected Balance:</span>
                <span class="${projectedBalance >= 0 ? 'positive' : 'negative'}">${formatCurrency(projectedBalance)}</span>
            `;
        }

        // Update the current match state
        this.currentMatch = {
            ...this.currentMatch,
            survivor: document.getElementById('survivor-select')?.value || '',
            perks: [
                document.getElementById('perk-slot-0')?.value,
                document.getElementById('perk-slot-1')?.value,
                document.getElementById('perk-slot-2')?.value,
                document.getElementById('perk-slot-3')?.value
            ].filter(Boolean),
            item: document.getElementById('item-select')?.value || '',
            addons: [
                document.getElementById('addon1-select')?.value,
                document.getElementById('addon2-select')?.value
            ].filter(Boolean),
            offering: document.getElementById('offering-select')?.value || '',
            options: {
                ...this.currentMatch.options,
                tunnelInsurance: document.getElementById('tunnel-insurance')?.checked || false,
                revivalMode: document.getElementById('revival-mode')?.checked || false
            }
        };
    }

    disableEliminatedSurvivors() {
        const survivorSelect = document.getElementById('survivor-select');
        if (!survivorSelect) return;

        // Get all eliminated survivors (including permanently eliminated)
        const eliminatedSurvivors = document.querySelectorAll('.survivor-card.eliminated, .survivor-card.perma-eliminated');
        const eliminatedNames = Array.from(eliminatedSurvivors).map(card => card.getAttribute('data-survivor'));

        // Disable eliminated survivors in the dropdown
        Array.from(survivorSelect.options).forEach(option => {
            if (option.value === '') return; // Skip the default option
            const isEliminated = eliminatedNames.includes(option.value);
            option.disabled = isEliminated;
            
            // If the currently selected survivor is eliminated, clear the selection
            if (isEliminated && option.selected) {
                survivorSelect.value = '';
                this.updateMatchSummary();
            }
        });
    }

    checkRevivalModeAvailability() {
        const revivalModeToggle = document.getElementById('revival-mode');
        const revivalSection = document.getElementById('revival-section');
        const revivalSelect = document.getElementById('revival-select');
        const revivalCostAmount = document.getElementById('revival-cost-amount');
        
        // Get all eliminated survivors that haven't been revived and aren't permanently eliminated
        const eliminatedSurvivors = document.querySelectorAll('.survivor-card.eliminated:not(.revived):not([data-has-been-revived="true"])');
        
        // Clear existing options except the first one
        while (revivalSelect.options.length > 1) {
            revivalSelect.remove(1);
        }
        
        if (eliminatedSurvivors.length > 0) {
            // Enable revival mode toggle and show section
            revivalModeToggle.disabled = false;
            revivalModeToggle.parentElement.classList.remove('disabled');
            revivalSection.style.display = 'block';
            
            // Add eliminated survivors to the revival dropdown
            eliminatedSurvivors.forEach(survivor => {
                const option = document.createElement('option');
                option.value = survivor.getAttribute('data-survivor');
                option.textContent = survivor.getAttribute('data-survivor');
                revivalSelect.appendChild(option);
            });
            
            // Calculate initial revival cost if a survivor is selected
            if (revivalSelect.value) {
                const selectedSurvivor = revivalSelect.value;
                const survivorCard = document.querySelector(`.survivor-card[data-survivor="${selectedSurvivor}"]`);
                if (survivorCard) {
                    const rentalPrice = this.getSurvivorCost(selectedSurvivor);
                    const revivalCost = Math.floor(rentalPrice * 0.5); // 50% of rental price
                    revivalCostAmount.textContent = `$${revivalCost}`;
                }
            } else {
                revivalCostAmount.textContent = '$0';
            }
        } else {
            // Disable revival mode toggle and hide section
            revivalModeToggle.checked = false;
            revivalModeToggle.disabled = true;
            revivalModeToggle.parentElement.classList.add('disabled');
            revivalSection.style.display = 'none';
            revivalCostAmount.textContent = '$0';
        }
    }

    // Get perk rating (1-5 stars)
    getPerkRating(perk) {
        const PERK_RATINGS = {
            // 5 Star Perks
            'Decisive Strike': 5, 'Off The Record': 5, 'Resurgence': 5, 'Unbreakable': 5, 'Deliverance': 5,
            // 4 Star Perks
            'Windows Of Opportunity': 4, 'Deja Vu': 4, 'Wicked': 4, 'Lithe': 4, 'Sprint Burst': 4,
            'Dead Hard': 4, 'Kindred': 4, 'Quick Gambit': 4, 'Bond': 4, 'Adrenaline': 4,
            'Reassurance': 4, 'Babysitter': 4, 'Resilience': 4, 'Balanced Landing': 4, 'Flip-Flop': 4,
            'Power Struggle': 4, "We're Gonna Live Forever": 4, 'Made For This': 4, 'Finesse': 4,
            'Hope': 4, 'Built To Last': 4, 'For The People': 4,
            // 3 Star Perks
            'Dramaturgy': 3, 'Overcome': 3, 'Blood Rush': 3, 'Saboteur': 3, 'Wiretap': 3,
            'Head On': 3, 'Slippery Meat': 3, 'Up The Ante': 3, 'Distortion': 3, 'Plot Twist': 3,
            'Strength In Shadows': 3, 'Reactive Healing': 3, 'Second Wind': 3, "We'll Make It": 3,
            'No One Left Behind': 3, 'Borrowed Time': 3, 'Background Player': 3, 'Poised': 3,
            'Open-Handed': 3, 'Aftercare': 3, 'Empathy': 3, 'Alert': 3, 'Inner Focus': 3,
            'Fogwise': 3, 'Any Means Necessary': 3, 'Lucky Break': 3, 'Camaraderie': 3,
            'Iron Will': 3, 'Soul Guard': 3, 'Buckle Up': 3, 'Prove Thy Self': 3,
            'Streetwise': 3, 'Boon: Circle Of Healing': 3, 'Botany Knowledge': 3,
            'Empathetic Connection': 3, 'Self-Care': 3, 'Inner Strength': 3, 'Troubleshooter': 3,
            'Blast Mine': 3, 'Hyperfocus': 3, 'Stake Out': 3, 'Boon: Exponential': 3,
            'Boon: Shadow Step': 3, 'Champion Of Light': 3, 'Fixated': 3, 'Vigil': 3,
            // 2 Star Perks
            'Mettle Of Man': 2, 'Detectives Hunch': 2, 'Breakdown': 2, 'Wake Up': 2,
            'Moment Of Glory': 2, 'Pharmacy': 2, 'Eyes Of Belmont': 2, 'Object Of Obsession': 2,
            'Desperate Measures': 2, 'Leader': 2, 'Sole Survivor': 2, 'Smash Hit': 2,
            'Chemical Trap': 2, 'Flashbang': 2, 'Parental Guidance': 2, 'Scavenger': 2,
            'Clairvoyance': 2, 'Tenacity': 2, 'Teamwork: Power Of Two': 2, 'Left Behind': 2,
            'Visionary': 2, 'Lucky Star': 2, 'Dark Sense': 2, 'Still Sight': 2,
            'Blood Pact': 2, 'Lightweight': 2, 'Better Together': 2, 'Small Game': 2,
            'Boon: Illumination': 2, 'Exultation': 2, 'Overzealous': 2, 'Solidarity': 2,
            'Corrective Action': 2, 'Bardic Inspiration': 2, 'Quick & Quiet': 2,
            'Boil Over': 2, 'Breakout': 2, 'Self-Preservation': 2, 'Light-Footed': 2,
            'Urban Evasion': 2, 'Potential Energy': 2, 'Rookie Spirit': 2, 'Hardened': 2,
            "Plunderer's Instinct": 2, 'Residual Manifest': 2, 'Teamwork: Collective Stealth': 2,
            'Dance With Me': 2, 'Deception': 2, 'Bite The Bullet': 2, 'Scene Partner': 2,
            'Better Than New': 2, 'Autodidact': 2, 'Mirrored Illusion': 2, 'Fast Track': 2,
            'Ace In The Hole': 2, 'Technician': 2, 'Repressed Alliance': 2, 'Calm Spirit': 2,
            'Appraisal': 2, 'Specialist': 2, 'Do No Harm': 2, 'Shoulder The Burden': 2,
            'Duty Of Care': 2,
            // 1 Star Perks
            'This Is Not Happening': 1, 'Counterforce': 1, 'Low Profile': 1, 'Spine Chill': 1,
            'Premonition': 1, 'Cut Loose': 1, 'Diversion': 1, 'Red Herring': 1,
            'Friendly Competition': 1, 'Boon: Dark Theory': 1, 'Deadline': 1,
            'Invocation: Weaving Spiders': 1, 'No-Mither': 1, 'Clean Break': 1,
            'Invocation: Treacherous Crows': 1, 'Rapid Response': 1
        };

        return PERK_RATINGS[perk] || 1;
    }

    // Add price cheatsheet to match setup
    addPriceCheatsheet() {
        const matchSetup = document.querySelector('.match-setup');
        if (!matchSetup) return;

        const cheatsheetWidget = document.createElement('div');
        cheatsheetWidget.className = 'price-widget';
        cheatsheetWidget.innerHTML = `
            <div class="widget-header">
                <h3>Price Guide</h3>
                <button class="widget-toggle">▼</button>
            </div>
            <div class="widget-content">
                <div class="widget-section">
                    <h4>Match Goals</h4>
                    <ul>
                        <li>Generator: $8 + $2 per additional</li>
                        <li>Safe Unhook: $10 each</li>
                        <li>Stun: $12 + $4 per additional</li>
                        <li>Escape: $15 (+$10 if after hatch)</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Services</h4>
                    <ul>
                        <li>Revival: 50% of rental</li>
                        <li>Tunnel Insurance: $20</li>
                        <li>Perk Recharge: $5 each</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Items & Add-ons</h4>
                    <ul>
                        <li>Brown: $1-5</li>
                        <li>Green: $2-6</li>
                        <li>Blue: $4-8</li>
                        <li>Purple: $6-10</li>
                        <li>Red: $10-14</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Perks</h4>
                    <ul>
                        <li>5★: $8-16</li>
                        <li>4★: $6-14</li>
                        <li>3★: $4-12</li>
                        <li>2★: $3-8</li>
                        <li>1★: $2-6</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Survivor Rental</h4>
                    <ul>
                        <li>3★: $15-35</li>
                        <li>2★: $10-30</li>
                        <li>1★: $5-25</li>
                    </ul>
                </div>
            </div>
        `;

        // Add CSS for the widget
        const style = document.createElement('style');
        style.textContent = `
            .price-widget {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 280px;
                background: rgba(42, 42, 42, 0.95);
                border: 1px solid #444;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                transition: all 0.3s ease;
            }
            .widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background: #333;
                border-radius: 8px 8px 0 0;
                cursor: pointer;
            }
            .widget-header h3 {
                margin: 0;
                color: #ffd700;
                font-size: 1.1em;
            }
            .widget-toggle {
                background: none;
                border: none;
                color: #ffd700;
                font-size: 1.2em;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            }
            .widget-content {
                padding: 15px;
                max-height: 500px;
                overflow-y: auto;
                transition: max-height 0.3s ease;
            }
            .widget-section {
                margin-bottom: 15px;
            }
            .widget-section h4 {
                margin: 0 0 8px 0;
                color: #ffd700;
                font-size: 1em;
            }
            .widget-section ul {
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .widget-section li {
                margin: 4px 0;
                color: #ccc;
                font-size: 0.9em;
            }
            .price-widget.collapsed .widget-content {
                max-height: 0;
                padding: 0 15px;
                overflow: hidden;
            }
            .price-widget.collapsed .widget-toggle {
                transform: rotate(-90deg);
            }
            .price-widget:hover {
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }
        `;
        document.head.appendChild(style);

        // Add toggle functionality
        const header = cheatsheetWidget.querySelector('.widget-header');
        header.addEventListener('click', () => {
            cheatsheetWidget.classList.toggle('collapsed');
        });

        // Add the widget to the body instead of match setup
        document.body.appendChild(cheatsheetWidget);

        // Update prices based on current rank
        this.updatePriceGuide();
    }

    // Add method to update price guide based on current rank
    updatePriceGuide() {
        const currentRank = this.getCurrentRank();
        const rankPrices = {
            'ash': {
                items: { common: 1, uncommon: 2, rare: 4, veryRare: 6, visceral: 10 },
                perks: { 1: 2, 2: 3, 3: 4, 4: 6, 5: 8 },
                survivors: { 1: 5, 2: 10, 3: 15 }
            },
            'bronze': {
                items: { common: 2, uncommon: 3, rare: 5, veryRare: 7, visceral: 11 },
                perks: { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 },
                survivors: { 1: 10, 2: 15, 3: 20 }
            },
            'silver': {
                items: { common: 3, uncommon: 4, rare: 6, veryRare: 8, visceral: 12 },
                perks: { 1: 4, 2: 5, 3: 8, 4: 10, 5: 12 },
                survivors: { 1: 15, 2: 20, 3: 25 }
            },
            'gold': {
                items: { common: 4, uncommon: 5, rare: 7, veryRare: 9, visceral: 13 },
                perks: { 1: 5, 2: 6, 3: 10, 4: 12, 5: 14 },
                survivors: { 1: 20, 2: 25, 3: 30 }
            },
            'iri': {
                items: { common: 5, uncommon: 6, rare: 8, veryRare: 10, visceral: 14 },
                perks: { 1: 6, 2: 8, 3: 12, 4: 14, 5: 16 },
                survivors: { 1: 25, 2: 30, 3: 35 }
            }
        };

        const prices = rankPrices[currentRank] || rankPrices['ash'];
        
        // Update the price guide content
        const widget = document.querySelector('.price-widget');
        if (widget) {
            const content = widget.querySelector('.widget-content');
            content.innerHTML = `
                <div class="widget-section">
                    <h4>Match Goals</h4>
                    <ul>
                        <li>Generator: $8 + $2 per additional</li>
                        <li>Safe Unhook: $10 each</li>
                        <li>Stun: $12 + $4 per additional</li>
                        <li>Escape: $15 (+$10 if after hatch)</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Services</h4>
                    <ul>
                        <li>Revival: 50% of rental</li>
                        <li>Tunnel Insurance: $20</li>
                        <li>Perk Recharge: $5 each</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Items & Add-ons (${currentRank.toUpperCase()})</h4>
                    <ul>
                        <li>Brown: $${prices.items.common}</li>
                        <li>Green: $${prices.items.uncommon}</li>
                        <li>Blue: $${prices.items.rare}</li>
                        <li>Purple: $${prices.items.veryRare}</li>
                        <li>Red: $${prices.items.visceral}</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Perks (${currentRank.toUpperCase()})</h4>
                    <ul>
                        <li>5★: $${prices.perks[5]}</li>
                        <li>4★: $${prices.perks[4]}</li>
                        <li>3★: $${prices.perks[3]}</li>
                        <li>2★: $${prices.perks[2]}</li>
                        <li>1★: $${prices.perks[1]}</li>
                    </ul>
                </div>
                <div class="widget-section">
                    <h4>Survivor Rental (${currentRank.toUpperCase()})</h4>
                    <ul>
                        <li>3★: $${prices.survivors[3]}</li>
                        <li>2★: $${prices.survivors[2]}</li>
                        <li>1★: $${prices.survivors[1]}</li>
                    </ul>
                </div>
            `;
        }
    }

    // Add method to check if a perk is on cooldown
    isPerkOnCooldown(perk) {
        // TODO: Implement cooldown tracking
        return false;
    }

    // Add method to update perk options
    updatePerkOptions() {
        const perkSelects = document.querySelectorAll('.match-perk-select');
        const selectedSurvivor = document.getElementById('survivor-select')?.value;
        const selectedPerks = Array.from(perkSelects).map(select => select.value);
        perkSelects.forEach(select => {
            // Store the current value
            const currentValue = select.value;
            // Rebuild the options list to ensure all logic is applied
            const allOptions = Array.from(select.options).map(opt => opt.value).filter(Boolean);
            // Remove all options except the first (placeholder)
            while (select.options.length > 1) select.remove(1);
            // Add options with unlock/cooldown/duplicate logic
            allOptions.forEach(optionValue => {
                // Disable if duplicate
                const isDuplicate = selectedPerks.filter(perk => perk === optionValue).length > 1;
                let isUnlocked = true;
                let isCooldown = false;
                if (selectedSurvivor) {
                    isUnlocked = this.isPerkUnlockedForSurvivor(optionValue, selectedSurvivor);
                    isCooldown = this.isPerkOnCooldownForSurvivor(optionValue, selectedSurvivor);
                }
                // Only add if not duplicate, unlocked, and not on cooldown
                if (!isDuplicate && isUnlocked && !isCooldown) {
                    const option = document.createElement('option');
                    option.value = optionValue;
                    option.textContent = optionValue;
                    select.appendChild(option);
                }
            });
            // Restore the previous value if still valid
            select.value = currentValue;
        });
    }

    // Update match history display
    updateMatchHistory() {
        const matchList = document.getElementById('match-list');
        if (!matchList) return;

        // Clear existing matches
        matchList.innerHTML = '';

        // Get filter and sort settings
        const filter = document.getElementById('match-filter').value;
        const sort = document.getElementById('sort-matches').value;

        // Filter matches
        let filteredMatches = [...this.matchHistory];
        if (filter === 'escaped') {
            filteredMatches = filteredMatches.filter(match => match.results.escaped);
        } else if (filter === 'died') {
            filteredMatches = filteredMatches.filter(match => !match.results.escaped);
        }

        // Sort matches
        switch (sort) {
            case 'oldest':
                filteredMatches.reverse();
                break;
            case 'highest':
                filteredMatches.sort((a, b) => b.earnings - a.earnings);
                break;
            case 'lowest':
                filteredMatches.sort((a, b) => a.earnings - b.earnings);
                break;
            // 'newest' is default (already sorted)
        }

        // Update total matches count
        document.getElementById('total-matches').textContent = this.matchHistory.length;

        // Calculate total earnings
        const totalEarnings = this.matchHistory.reduce((sum, match) => sum + match.earnings, 0);
        document.getElementById('total-earnings-history').textContent = `$${totalEarnings}`;

        // Display matches
        filteredMatches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = 'match-entry';
            
            const date = new Date(match.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            matchElement.innerHTML = `
                <div class="match-header">
                    <span class="match-date">${formattedDate}</span>
                    <span class="match-survivor">${match.survivor}</span>
                    <span class="match-result ${match.results.escaped ? 'escaped' : 'died'}">
                        ${match.results.escaped ? 'Escaped' : 'Died'}
                    </span>
                </div>
                <div class="match-details">
                    <div class="match-stats">
                        <span>Gens: ${match.results.gens}</span>
                        <span>Saves: ${match.results.saves}</span>
                        <span>Stuns: ${match.results.stuns}</span>
                        <span>Pips: ${match.results.pips}</span>
                    </div>
                    <div class="match-earnings">
                        <span>Earnings: $${match.earnings}</span>
                        <span>Loadout: $${match.loadoutCost}</span>
                        <span>Net: $${match.earnings - match.loadoutCost}</span>
                    </div>
                    ${match.revival ? `
                        <div class="match-revival">
                            Revived: ${match.revival.survivor} (Cost: $${match.revival.cost})
                        </div>
                    ` : ''}
                </div>
            `;
            
            matchList.appendChild(matchElement);
        });

        // Add CSS for match history
        const style = document.createElement('style');
        style.textContent = `
            .match-entry {
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 8px;
                margin-bottom: 10px;
                padding: 15px;
            }
            .match-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-weight: bold;
            }
            .match-result {
                padding: 2px 8px;
                border-radius: 4px;
            }
            .match-result.escaped {
                background: #4caf50;
                color: white;
            }
            .match-result.died {
                background: #f44336;
                color: white;
            }
            .match-details {
                display: grid;
                gap: 10px;
            }
            .match-stats, .match-earnings {
                display: flex;
                gap: 15px;
            }
            .match-revival {
                color: #ffd700;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize match history display
    initializeMatchHistory() {
        // Add event listeners for filter and sort
        const filterSelect = document.getElementById('match-filter');
        const sortSelect = document.getElementById('sort-matches');
        
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.updateMatchHistory());
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.updateMatchHistory());
        }

        // Initial display
        this.updateMatchHistory();
    }

    // Add New Run button
    addNewRunButton() {
        const dataManagement = document.querySelector('.data-management');
        if (!dataManagement) return;

        const newRunBtn = document.createElement('button');
        newRunBtn.type = 'button';
        newRunBtn.className = 'data-btn new-run-btn';
        newRunBtn.textContent = 'New Run';
        newRunBtn.onclick = () => {
            if (confirm('Are you sure you want to start a new run? This will clear all match history and cannot be undone.')) {
                this.newRun();
            }
        };

        // Add CSS for the button
        const style = document.createElement('style');
        style.textContent = `
            .new-run-btn {
                background-color: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: background-color 0.3s;
            }
            .new-run-btn:hover {
                background-color: #d32f2f;
            }
        `;
        document.head.appendChild(style);

        // Insert the button before the export button
        const exportBtn = dataManagement.querySelector('.export-btn');
        if (exportBtn) {
            dataManagement.insertBefore(newRunBtn, exportBtn);
        } else {
            dataManagement.appendChild(newRunBtn);
        }
    }

    // Start a new run
    newRun() {
        // Clear match history
        this.matchHistory = [];
        localStorage.removeItem('matchHistory');
        
        // Reset bank balance to $250
        this.bankBalance = 250;
        this.saveBankBalance();
        this.updateBankBalanceDisplay();
        
        // Reset current match
        this.resetCurrentMatch();
        
        // --- NEW: Reset rank and pips ---
        this.currentRank = 'Ash IV';
        this.currentPips = 0;
        localStorage.setItem('currentRank', this.currentRank);
        localStorage.setItem('currentPips', this.currentPips);
        this.updateSummaryBarPipsAndRank();
        this.updateRankProgressDisplay();
        // --- END NEW ---
        
        // Update UI
        this.updateMatchHistory();
        this.updateMatchSummary();
        
        // Show confirmation
        alert('New run started! All match history has been cleared and bank balance reset to $250.');
    }

    // Add bank balance display
    addBankBalanceDisplay() {
        // Create a new summary section at the top
        const matchTracking = document.querySelector('.match-tracking');
        if (!matchTracking) return;

        const summarySection = document.createElement('div');
        summarySection.className = 'summary-bar';
        summarySection.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Total Matches</span>
                <span class="summary-value" id="total-matches">0</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Earnings</span>
                <span class="summary-value" id="total-earnings-history">$0</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Current Rank</span>
                <span class="summary-value" id="current-rank">Ash IV</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Pips</span>
                <span class="summary-value" id="current-pips">0/3</span>
            </div>
            <div class="summary-item bank-balance">
                <span class="summary-label">Bank Balance</span>
                <span class="summary-value" id="bank-balance">$${this.bankBalance}</span>
            </div>
        `;

        // Insert the summary section at the top of match tracking
        matchTracking.insertBefore(summarySection, matchTracking.firstChild);

        // Remove the old summary section if it exists
        const oldSummary = document.querySelector('.match-history .progress-summary');
        if (oldSummary) {
            oldSummary.remove();
        }
    }

    // Update bank balance display
    updateBankBalanceDisplay() {
        const bankBalanceElement = document.getElementById('bank-balance');
        if (bankBalanceElement) {
            bankBalanceElement.textContent = `$${this.bankBalance}`;
        }
    }

    // Add method to sell a survivor
    sellSurvivor(survivor) {
        const survivorCard = document.querySelector(`.survivor-card[data-survivor="${survivor}"]`);
        if (!survivorCard) return;

        // Check if survivor is already eliminated
        if (survivorCard.classList.contains('eliminated')) {
            alert('Cannot sell an eliminated survivor.');
            return;
        }

        // Check if survivor is already permanently eliminated
        if (survivorCard.classList.contains('perma-eliminated')) {
            alert('This survivor has already been sold.');
            return;
        }

        // Calculate sell value (half of rental price)
        const rentalPrice = this.getSurvivorCost(survivor);
        const sellValue = Math.floor(rentalPrice * 0.5);

        // Confirm with user
        if (confirm(`Are you sure you want to sell ${survivor}? You will receive $${sellValue} and they will be permanently eliminated.`)) {
            // Mark survivor as permanently eliminated
            survivorCard.classList.remove('eliminated');
            survivorCard.classList.add('perma-eliminated');
            
            // Add sell value to bank balance
            this.bankBalance += sellValue;
            this.saveBankBalance();
            this.updateBankBalanceDisplay();

            // Update UI
            this.disableEliminatedSurvivors();
            this.checkRevivalModeAvailability();

            // Show confirmation
            alert(`${survivor} has been sold for $${sellValue}. New balance: $${this.bankBalance}`);
        }
    }

    // Add sell button to survivor cards
    addSellButton(survivorCard) {
        const sellBtn = document.createElement('button');
        sellBtn.type = 'button';
        sellBtn.className = 'sell-card-btn';
        sellBtn.title = 'Sell Survivor';
        sellBtn.textContent = '$';
        sellBtn.onclick = (e) => {
            e.stopPropagation();
            const survivor = survivorCard.getAttribute('data-survivor');
            this.sellSurvivor(survivor);
        };

        // Add CSS for the sell button
        const style = document.createElement('style');
        style.textContent = `
            .sell-card-btn {
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                color: #4caf50;
                border: none;
                font-size: 1.2em;
                font-weight: bold;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .survivor-card:hover .sell-card-btn {
                opacity: 1;
            }
            .sell-card-btn:hover {
                color: #45a049;
            }
            .survivor-card.perma-eliminated .sell-card-btn,
            .survivor-card.eliminated .sell-card-btn {
                display: none;
            }
        `;
        document.head.appendChild(style);

        // Insert the sell button after the reset button
        const resetBtn = survivorCard.querySelector('.reset-card-btn');
        if (resetBtn) {
            resetBtn.parentNode.insertBefore(sellBtn, resetBtn.nextSibling);
        }
    }

    // --- NEW: Update pips and rank logic ---
    updatePipsAndRank(pipsEarned) {
        // Define the rank structure
        const ranks = [
            { name: 'Ash IV', pips: 3 },
            { name: 'Ash III', pips: 3 },
            { name: 'Ash II', pips: 3 },
            { name: 'Ash I', pips: 4 },
            { name: 'Silver IV', pips: 5 },
            { name: 'Silver III', pips: 5 },
            { name: 'Silver II', pips: 5 },
            { name: 'Silver I', pips: 5 },
            { name: 'Gold IV', pips: 5 },
            { name: 'Gold III', pips: 5 },
            { name: 'Gold II', pips: 5 },
            { name: 'Gold I', pips: 5 },
            { name: 'Iridescent IV', pips: 5 },
            { name: 'Iridescent III', pips: 5 },
            { name: 'Iridescent II', pips: 5 },
            { name: 'Iridescent I', pips: 1 }
        ];
        // Find current rank index
        let rankIndex = ranks.findIndex(r => r.name === this.currentRank);
        if (rankIndex === -1) rankIndex = 0;
        let pips = this.currentPips + (parseInt(pipsEarned) || 0);
        // Handle pip overflow/underflow
        while (pips > ranks[rankIndex].pips) {
            pips -= ranks[rankIndex].pips;
            rankIndex = Math.min(rankIndex + 1, ranks.length - 1);
        }
        while (pips < 0) {
            if (rankIndex === 0) { pips = 0; break; }
            rankIndex--;
            pips += ranks[rankIndex].pips;
        }
        this.currentRank = ranks[rankIndex].name;
        this.currentPips = pips;
        localStorage.setItem('currentRank', this.currentRank);
        localStorage.setItem('currentPips', this.currentPips);
    }

    // --- NEW: Update summary bar pips and rank ---
    updateSummaryBarPipsAndRank() {
        const rankMap = {
            'Ash IV': 3, 'Ash III': 3, 'Ash II': 3, 'Ash I': 4,
            'Silver IV': 5, 'Silver III': 5, 'Silver II': 5, 'Silver I': 5,
            'Gold IV': 5, 'Gold III': 5, 'Gold II': 5, 'Gold I': 5,
            'Iridescent IV': 5, 'Iridescent III': 5, 'Iridescent II': 5, 'Iridescent I': 1
        };
        const pips = this.currentPips;
        const maxPips = rankMap[this.currentRank] || 3;
        const pipsText = `${pips}/${maxPips}`;
        const pipsElem = document.getElementById('current-pips');
        if (pipsElem) pipsElem.textContent = pipsText;
        const rankElem = document.getElementById('current-rank');
        if (rankElem) rankElem.textContent = this.currentRank;
    }

    // --- NEW: Update Rank Progress display ---
    updateRankProgressDisplay() {
        // Remove all current highlights
        document.querySelectorAll('.rank-level').forEach(lvl => lvl.classList.remove('current'));
        document.querySelectorAll('.pip').forEach(pip => pip.classList.remove('active'));
        // Find which rank and level to highlight
        const rankParts = this.currentRank.split(' ');
        let rankType = rankParts[0].toLowerCase();
        let rankLevel = rankParts[1];
        if (rankType === 'iridescent') rankType = 'iri';
        const rankDiv = document.querySelector(`.rank.${rankType}`);
        if (!rankDiv) return;
        const levelDivs = rankDiv.querySelectorAll('.rank-level');
        let levelIndex = 0;
        switch (rankLevel) {
            case 'IV': levelIndex = 0; break;
            case 'III': levelIndex = 1; break;
            case 'II': levelIndex = 2; break;
            case 'I': levelIndex = 3; break;
        }
        const currentLevelDiv = levelDivs[levelIndex];
        if (currentLevelDiv) currentLevelDiv.classList.add('current');
        // Fill pips for all previous levels and current
        let totalPips = 0;
        // Map of max pips per level for each rank type
        const maxPipsMap = {
            'ash': [3, 3, 3, 4],
            'silver': [5, 5, 5, 5],
            'gold': [5, 5, 5, 5],
            'iri': [5, 5, 5, 1]
        };
        const maxPipsArr = maxPipsMap[rankType] || [3, 3, 3, 4];
        for (let i = 0; i < levelDivs.length; i++) {
            const pipDivs = levelDivs[i].querySelectorAll('.pip');
            let fillCount = 0;
            if (i < levelIndex) {
                // All pips in previous levels are filled
                fillCount = pipDivs.length;
            } else if (i === levelIndex) {
                // Only fill up to current pips in current level
                fillCount = this.currentPips;
            }
            for (let j = 0; j < pipDivs.length; j++) {
                if (j < fillCount) pipDivs[j].classList.add('active');
            }
        }
    }

    // --- NEW: Get unique perks for a survivor ---
    getSurvivorUniquePerks(survivor) {
        // This must match the perks array in index.php
        const perks = {
            'Dwight': ['Bond', 'Leader', 'Prove Thy Self'],
            'Meg': ['Quick & Quiet', 'Adrenaline', 'Sprint Burst'],
            'Claudette': ['Empathy', 'Botany Knowledge', 'Self-Care'],
            'Jake': ['Iron Will', 'Calm Spirit', 'Saboteur'],
            'Nea': ['Balanced Landing', 'Urban Evasion', 'Streetwise'],
            'David': ['Dead Hard', "We're Gonna Live Forever", 'No-Mither'],
            'Bill': ['Left Behind', 'Borrowed Time', 'Unbreakable'],
            'Ace': ['Ace In The Hole', 'Up The Ante', 'Open-Handed'],
            'Feng': ['Technician', 'Lithe', 'Alert'],
            'Laurie': ['Sole Survivor', 'Object Of Obsession', 'Decisive Strike'],
            'Quentin': ['Wake Up', 'Pharmacy', 'Vigil'],
            'Tapp': ['Tenacity', "Detectives Hunch", 'Stake Out'],
            'Kate': ['Dance With Me', 'Windows Of Opportunity', 'Boil Over'],
            'Adam': ['Diversion', 'Autodidact', 'Deliverance'],
            'Jeff': ['Breakdown', 'Aftercare', 'Distortion'],
            'Jane': ['Poised', 'Head On', 'Solidarity'],
            'Ash': ['Flip-Flop', 'Buckle Up', 'Mettle Of Man'],
            'Steve': ['Babysitter', 'Camaraderie', 'Second Wind'],
            'Nancy': ['Better Together', 'Fixated', 'Inner Strength'],
            'Yui': ['Any Means Necessary', 'Lucky Break', 'Breakout'],
            'Zarina': ['Off The Record', 'Red Herring', 'For The People'],
            'Cheryl': ['Soul Guard', 'Blood Pact', 'Repressed Alliance'],
            'Felix': ['Visionary', 'Desperate Measures', 'Built To Last'],
            'Elodie': ['Appraisal', 'Deception', 'Power Struggle'],
            'Yun-Jin': ['Fast Track', 'Smash Hit', 'Self-Preservation'],
            'Jill': ['Counterforce', 'Resurgence', 'Blast Mine'],
            'Leon': ['Bite The Bullet', 'Flashbang', 'Rookie Spirit'],
            'Mikaela': ['Clairvoyance', 'Boon: Circle Of Healing', 'Boon: Shadow Step'],
            'Jonah': ['Overcome', 'Corrective Action', 'Boon: Exponential'],
            'Yoichi': ['Parental Guidance', 'Empathetic Connection', 'Boon: Dark Theory'],
            'Haddie': ['Inner Focus', 'Residual Manifest', 'Overzealous'],
            'Ada': ['Wiretap', 'Reactive Healing', 'Low Profile'],
            'Rebecca': ['Better Than New', 'Reassurance', 'Hyperfocus'],
            'Vittorio': ['Potential Energy', 'Fogwise', 'Quick Gambit'],
            'Thalita': ['Friendly Competition', 'Teamwork: Power Of Two', 'Cut Loose'],
            'Renato': ['Blood Rush', 'Teamwork: Collective Stealth', 'Background Player'],
            'Gabriel': ['Troubleshooter', 'Made For This', 'Scavenger'],
            'Nicolas Cage': ['Dramaturgy', 'Scene Partner', 'Plot Twist'],
            'Ellen Ripley': ['Chemical Trap', 'Light-Footed', 'Lucky Star'],
            'Alan Wake': ['Champion Of Light', 'Boon: Illumination', 'Deadline'],
            'Sable': ['Invocation: Weaving Spiders', 'Strength In Shadows', 'Wicked'],
            'The Troupe': ['Bardic Inspiration', 'Mirrored Illusion', 'Still Sight'],
            'Lara Croft': ['Finesse', 'Hardened', 'Specialist'],
            'Trevor Belmont': ['Exultation', 'Eyes Of Belmont', 'Moment Of Glory'],
            'Taurie': ['Clean Break', 'Invocation: Treacherous Crows', 'Shoulder The Burden'],
            'Orela': ['Do No Harm', 'Duty Of Care', 'Rapid Response']
        };
        return perks[survivor] || [];
    }

    // --- NEW: Check if a perk is unlocked for a survivor ---
    isPerkUnlockedForSurvivor(perk, survivor) {
        // General perks are always unlocked
        const generalPerks = [
            'No One Left Behind', "We'll Make It", 'Kindred', "Plunderer's Instinct", 'Slippery Meat', 'Deja Vu', 'Hope', 'Lightweight', 'Resilience', 'Small Game', 'Spine Chill'
        ];
        if (generalPerks.includes(perk)) return true;
        // If it's this survivor's own perk, always allowed
        if (this.getSurvivorUniquePerks(survivor).includes(perk)) return true;
        // Otherwise, check if the owner has used it 6+ times
        const owner = this.getPerkOwner(perk);
        if (!owner) return true; // fallback: allow if not found
        return (this.perkUsage[owner] && this.perkUsage[owner][perk] >= 6);
    }

    // --- NEW: Get the owner of a unique perk ---
    getPerkOwner(perk) {
        const perks = this.getAllSurvivorPerks();
        for (const survivor in perks) {
            if (perks[survivor].includes(perk)) return survivor;
        }
        return null;
    }

    // --- NEW: Get all survivor unique perks mapping ---
    getAllSurvivorPerks() {
        return {
            'Dwight': ['Bond', 'Leader', 'Prove Thy Self'],
            'Meg': ['Quick & Quiet', 'Adrenaline', 'Sprint Burst'],
            'Claudette': ['Empathy', 'Botany Knowledge', 'Self-Care'],
            'Jake': ['Iron Will', 'Calm Spirit', 'Saboteur'],
            'Nea': ['Balanced Landing', 'Urban Evasion', 'Streetwise'],
            'David': ['Dead Hard', "We're Gonna Live Forever", 'No-Mither'],
            'Bill': ['Left Behind', 'Borrowed Time', 'Unbreakable'],
            'Ace': ['Ace In The Hole', 'Up The Ante', 'Open-Handed'],
            'Feng': ['Technician', 'Lithe', 'Alert'],
            'Laurie': ['Sole Survivor', 'Object Of Obsession', 'Decisive Strike'],
            'Quentin': ['Wake Up', 'Pharmacy', 'Vigil'],
            'Tapp': ['Tenacity', "Detectives Hunch", 'Stake Out'],
            'Kate': ['Dance With Me', 'Windows Of Opportunity', 'Boil Over'],
            'Adam': ['Diversion', 'Autodidact', 'Deliverance'],
            'Jeff': ['Breakdown', 'Aftercare', 'Distortion'],
            'Jane': ['Poised', 'Head On', 'Solidarity'],
            'Ash': ['Flip-Flop', 'Buckle Up', 'Mettle Of Man'],
            'Steve': ['Babysitter', 'Camaraderie', 'Second Wind'],
            'Nancy': ['Better Together', 'Fixated', 'Inner Strength'],
            'Yui': ['Any Means Necessary', 'Lucky Break', 'Breakout'],
            'Zarina': ['Off The Record', 'Red Herring', 'For The People'],
            'Cheryl': ['Soul Guard', 'Blood Pact', 'Repressed Alliance'],
            'Felix': ['Visionary', 'Desperate Measures', 'Built To Last'],
            'Elodie': ['Appraisal', 'Deception', 'Power Struggle'],
            'Yun-Jin': ['Fast Track', 'Smash Hit', 'Self-Preservation'],
            'Jill': ['Counterforce', 'Resurgence', 'Blast Mine'],
            'Leon': ['Bite The Bullet', 'Flashbang', 'Rookie Spirit'],
            'Mikaela': ['Clairvoyance', 'Boon: Circle Of Healing', 'Boon: Shadow Step'],
            'Jonah': ['Overcome', 'Corrective Action', 'Boon: Exponential'],
            'Yoichi': ['Parental Guidance', 'Empathetic Connection', 'Boon: Dark Theory'],
            'Haddie': ['Inner Focus', 'Residual Manifest', 'Overzealous'],
            'Ada': ['Wiretap', 'Reactive Healing', 'Low Profile'],
            'Rebecca': ['Better Than New', 'Reassurance', 'Hyperfocus'],
            'Vittorio': ['Potential Energy', 'Fogwise', 'Quick Gambit'],
            'Thalita': ['Friendly Competition', 'Teamwork: Power Of Two', 'Cut Loose'],
            'Renato': ['Blood Rush', 'Teamwork: Collective Stealth', 'Background Player'],
            'Gabriel': ['Troubleshooter', 'Made For This', 'Scavenger'],
            'Nicolas Cage': ['Dramaturgy', 'Scene Partner', 'Plot Twist'],
            'Ellen Ripley': ['Chemical Trap', 'Light-Footed', 'Lucky Star'],
            'Alan Wake': ['Champion Of Light', 'Boon: Illumination', 'Deadline'],
            'Sable': ['Invocation: Weaving Spiders', 'Strength In Shadows', 'Wicked'],
            'The Troupe': ['Bardic Inspiration', 'Mirrored Illusion', 'Still Sight'],
            'Lara Croft': ['Finesse', 'Hardened', 'Specialist'],
            'Trevor Belmont': ['Exultation', 'Eyes Of Belmont', 'Moment Of Glory'],
            'Taurie': ['Clean Break', 'Invocation: Treacherous Crows', 'Shoulder The Burden'],
            'Orela': ['Do No Harm', 'Duty Of Care', 'Rapid Response']
        };
    }
}

// Initialize match tracker
window.matchTracker = new MatchTracker();

// Event listeners for match tracking
document.addEventListener('DOMContentLoaded', () => {
    // Counter buttons
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.closest('.counter').querySelector('input').id;
            const value = e.target.classList.contains('plus') ? 1 : -1;
            matchTracker.updateCounter(type, value);
        });
    });

    // Escape toggle
    const escapedCheckbox = document.getElementById('escaped');
    if (escapedCheckbox) {
        escapedCheckbox.addEventListener('change', () => {
            matchTracker.updateEscape();
        });
    }

    // Hatch closed toggle
    const hatchClosedCheckbox = document.getElementById('hatch-closed');
    if (hatchClosedCheckbox) {
        hatchClosedCheckbox.addEventListener('change', () => {
            matchTracker.updateHatchClosed();
        });
    }

    // Save match button
    document.querySelector('.save-match-btn').addEventListener('click', () => {
        matchTracker.saveMatchResults();
    });

    // Loadout cost update listeners
    const loadoutElements = [
        'survivor-select',
        'perk-slot-0',
        'perk-slot-1',
        'perk-slot-2',
        'perk-slot-3',
        'item-select',
        'addon1-select',
        'addon2-select',
        'offering-select',
        'tunnel-insurance'
    ];

    loadoutElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', () => {
                matchTracker.updateMatchSummary();
            });
        }
    });

    // Initialize match history display
    matchTracker.initializeMatchHistory();
}); 