// All JavaScript from index.php moved here
// (The code will be pasted in the next step) 

// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

function updateLives(survivor, change) {
    // Block positive life changes in extreme mode
    if (document.getElementById('extremeMode').checked && change > 0) {
        return;
    }

    const survivorCard = document.querySelector(`.survivor-card[data-survivor="${survivor}"]`);
    if (!survivorCard) return;

    const lives = survivorCard.querySelectorAll('.life');
    const currentLives = survivorCard.querySelectorAll('.life.active').length;
    const newLives = Math.max(0, Math.min(3, currentLives + change));

    // Update lives display
    lives.forEach((life, index) => {
        life.classList.toggle('active', index < newLives);
    });

    // Handle elimination
    if (newLives === 0) {
        if (survivorCard.classList.contains('revived')) {
            survivorCard.classList.remove('revived');
            survivorCard.classList.add('perma-eliminated');
            survivorCard.setAttribute('data-has-been-revived', 'true');
        } else {
            survivorCard.classList.add('eliminated');
        }
    } else {
        survivorCard.classList.remove('eliminated', 'perma-eliminated');
        survivorCard.removeAttribute('data-has-been-revived');
    }

    // Update survivor select dropdown
    const survivorSelect = document.getElementById('survivor-select');
    if (survivorSelect) {
        // If the current selection is now eliminated or perma-eliminated, clear it
        if (survivorSelect.value === survivor && newLives === 0) {
            survivorSelect.value = '';
        }
        
        // Update disabled state for all options
        Array.from(survivorSelect.options).forEach(option => {
            if (option.value === '') return; // Skip the default option
            const survivorCard = document.querySelector(`.survivor-card[data-survivor="${option.value}"]`);
            if (survivorCard) {
                option.disabled = survivorCard.classList.contains('eliminated') || 
                                survivorCard.classList.contains('perma-eliminated');
            }
        });
    }

    // Update Revival Mode toggle and dropdown
    const revivalModeToggle = document.getElementById('revival-mode');
    const revivalSection = document.getElementById('revival-section');
    const revivalSelect = document.getElementById('revival-select');
    
    if (revivalModeToggle && revivalSection && revivalSelect) {
        const eliminatedSurvivors = document.querySelectorAll('.survivor-card.eliminated:not(.revived):not(.perma-eliminated)');
        
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
                    const rentalPrice = window.matchTracker.getSurvivorCost(selectedSurvivor);
                    const revivalCost = Math.floor(rentalPrice * 0.5); // 50% of rental price
                    document.getElementById('revival-cost-amount').textContent = `$${revivalCost}`;
                }
            } else {
                document.getElementById('revival-cost-amount').textContent = '$0';
            }
        } else {
            // Disable revival mode toggle and hide section
            revivalModeToggle.checked = false;
            revivalModeToggle.disabled = true;
            revivalModeToggle.parentElement.classList.add('disabled');
            revivalSection.style.display = 'none';
            document.getElementById('revival-cost-amount').textContent = '$0';
        }
    }

    saveState();
    // Check if revival mode should be enabled after any life change
    if (typeof window.matchTracker !== 'undefined') {
        window.matchTracker.checkRevivalModeAvailability();
    }
}

// Add click handler for survivor cards to toggle revived state
// Prevent revival in Extreme Mode
document.querySelectorAll('.survivor-card').forEach(card => {
    card.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (document.getElementById('extremeMode').checked) return; // Prevent revival in Extreme Mode
        if (this.classList.contains('perma-eliminated')) return; // Can't revive if perma-eliminated
        if (this.classList.contains('eliminated')) {
            this.classList.remove('eliminated');
            this.classList.add('revived');
            this.setAttribute('data-has-been-revived', 'true');
            const lives = this.querySelectorAll('.life');
            lives.forEach((life, index) => {
                life.classList.toggle('active', index === 0);
            });
            saveState();
        }
    });
});

// Update resetSurvivorCard to clear perma-eliminated and revived flags
function resetSurvivorCard(event, survivor) {
    event.stopPropagation();
    const card = document.querySelector(`.survivor-card[data-survivor="${survivor}"]`);
    if (!card) return;
    card.classList.remove('eliminated', 'revived', 'perma-eliminated');
    card.removeAttribute('data-has-been-revived');
    const lives = card.querySelectorAll('.life');
    lives.forEach((life, index) => {
        life.classList.add('active');
    });
    saveState();
}

// Prevent duplicate perk selection in match tracking
function updateMatchPerkDropdowns() {
    const selects = Array.from(document.querySelectorAll('.match-perk-select'));
    // Build a map of selected perks and their dropdowns
    const selectedMap = {};
    selects.forEach(sel => {
        if (sel.value) {
            if (!selectedMap[sel.value]) selectedMap[sel.value] = [];
            selectedMap[sel.value].push(sel);
        }
    });
    // If any perk is selected in more than one dropdown, clear all but the first and alert
    Object.keys(selectedMap).forEach(perk => {
        if (selectedMap[perk].length > 1) {
            selectedMap[perk].forEach((sel, idx) => {
                if (idx > 0) {
                    sel.value = "";
                }
            });
            alert('You cannot select the same perk more than once!');
        }
    });
    // Now, disable already-selected perks in other dropdowns
    const selected = selects.map(sel => sel.value).filter(val => val);
    selects.forEach(sel => {
        Array.from(sel.options).forEach(opt => {
            if (opt.value === "") return;
            opt.disabled = selected.includes(opt.value) && sel.value !== opt.value;
        });
    });
}
document.querySelectorAll('.match-perk-select').forEach(sel => {
    sel.addEventListener('change', updateMatchPerkDropdowns);
});
updateMatchPerkDropdowns();

function toggleExtremeMode() {
    const isExtreme = document.getElementById('extremeMode').checked;
    document.querySelectorAll('.life-btn.plus').forEach(btn => {
        btn.style.display = isExtreme ? 'none' : 'block';
    });
    document.querySelectorAll('.life-btn.minus').forEach(btn => {
        btn.style.display = 'block';
    });
    document.querySelectorAll('.survivor-card').forEach(card => {
        const lives = card.querySelectorAll('.life');
        if (isExtreme) {
            lives.forEach((life, index) => {
                life.classList.toggle('active', index === 0);
            });
        } else {
            // FULL RESET: 3 lives, remove all special states
            card.classList.remove('eliminated', 'revived', 'perma-eliminated');
            card.removeAttribute('data-has-been-revived');
            lives.forEach(life => {
                life.classList.add('active');
            });
        }
    });
    saveState();
}

function saveState() {
    const state = {};
    document.querySelectorAll('.survivor-card').forEach(card => {
        const survivor = card.getAttribute('data-survivor');
        const lives = card.querySelectorAll('.life.active').length;
        const perks = Array.from(card.querySelectorAll('.perk-slot')).map(slot => {
            const perkName = slot.querySelector('.perk-name').textContent;
            return perkName;
        });
        state[survivor] = {
            lives: lives,
            perks: perks,
            eliminated: card.classList.contains('eliminated'),
            'perma-eliminated': card.classList.contains('perma-eliminated')
        };
    });
    localStorage.setItem('challenge_state', JSON.stringify(state));
}

// ... (rest of the JS from index.php should be pasted here) 