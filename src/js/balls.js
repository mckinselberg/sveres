import { DEFAULTS } from './config.js';
const selectedBallShapeSelect = document.getElementById('selectedBallShape');
let sandboxModeEnabled = false;
const sandboxModeCheckbox = document.getElementById('sandboxMode');
let healthSystemEnabled = true;
const enableHealthSystemCheckbox = document.getElementById('enableHealthSystem');
let globalScore = 0; // New global score variable
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_building_practice
// import { throttle } from 'lodash';


var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var width = canvas.width = window.innerWidth;
var height = canvas.height = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
ctx.globalCompositeOperation = "source-over";

function random(min, max) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}

function logarithmicSlider(value, min, max) {
    const minp = 0;
    const maxp = 100;
    const minv = Math.log(min);
    const maxv = Math.log(max);
    const scale = (maxv - minv) / (maxp - minp);
    return Math.round(Math.exp(minv + scale * (value - minp)));
}

function inverseLogarithmicSlider(value, min, max) {
    const minp = 0;
    const maxp = 100;
    const minv = Math.log(min);
    const maxv = Math.log(max);
    const scale = (maxv - minv) / (maxp - minp);
    return (Math.log(value) - minv) / scale + minp;
}

function Ball(x, y, velX, velY, color, size, shape = DEFAULTS.ballShape) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.collisionCount = 0; // Track number of collisions
    this.health = 100; // Ball health system
    this.maxHealth = 100; // Maximum health
    this.color = color;
    this.originalColor = color; // Store original color for restoration
    this.size = size;
    this.originalSize = size; // Store the original size
    this.shape = shape; // Shape type: 'circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star'
    this.scaleX = 1; // Horizontal scale for deformation
    this.scaleY = 1; // Vertical scale for deformation
    this.deformAngle = 0; // Rotation angle for deformation direction
    this.ripples = []; // Array to store active ripples
    this.rippleCenter = { x: 0, y: 0 }; // Center point of ripple origin
    
    // Simple animation state tracking only
    this.isAnimating = false; // Track if ball is currently being animated
    this.lastAnimationTime = 0; // Prevent animation conflicts
    this.lastCollisionTime = 0; // Prevent rapid collision processing
    this.rotation = 0; // Rotation angle for polygonal shapes
    this.rotationSpeed = (Math.random() - 0.5) * 0.02; // Random rotation speed
    this.isSleeping = false; // For performance optimization
    this._lastMultiplier = 1; // For speed multiplier tracking
}

Ball.prototype.draw = function() {
    ctx.save(); // Save the current transformation matrix
    
    // Move to ball center and apply rotation for deformation direction
    ctx.translate(this.x, this.y);
    ctx.rotate(this.deformAngle);
    ctx.scale(this.scaleX, this.scaleY);

    // Add glowing effect if this is the selected ball
    if (this === selectedBall) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
    }
    
    // Draw the main ball
    ctx.beginPath();
    ctx.fillStyle = this.originalColor; // Use original color as base

    if (this.shape === 'circle') {
        ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
    } else if (this.shape === 'square') {
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
    } else if (this.shape === 'triangle') {
        // Equilateral triangle
        const halfSide = this.size * Math.sqrt(3) / 2;
        const topY = -this.size;
        const bottomY = this.size / 2;
        ctx.moveTo(0, topY);
        ctx.lineTo(-halfSide, bottomY);
        ctx.lineTo(halfSide, bottomY);
        ctx.closePath();
    } else if (this.shape === 'diamond') {
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
    } else if (this.shape === 'pentagon') {
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 5), this.size * Math.sin(i * 2 * Math.PI / 5));
        }
        ctx.closePath();
    } else if (this.shape === 'hexagon') {
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 6), this.size * Math.sin(i * 2 * Math.PI / 6));
        }
        ctx.closePath();
    } else if (this.shape === 'octagon') {
        for (let i = 0; i < 8; i++) {
            ctx.lineTo(this.size * Math.cos(i * 2 * Math.PI / 8), this.size * Math.sin(i * 2 * Math.PI / 8));
        }
        ctx.closePath();
    } else if (this.shape === 'star') {
        const outerRadius = this.size;
        const innerRadius = this.size / 2;
        const numPoints = 6; // Changed to 6 points
        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI / numPoints * i;
            ctx.lineTo(radius * Math.sin(angle), -radius * Math.cos(angle));
        }
        ctx.closePath();
    }
    ctx.fill();
    
    // Draw health overlay
    if (healthSystemEnabled && this.health < this.maxHealth) {
        const healthRatio = this.health / this.maxHealth;
        const opacity = 1 - healthRatio; // Opacity increases as health decreases (0 to 1)
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.arc(0, 0, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    ctx.restore(); // Restore the transformation matrix
}

Ball.prototype.applyWallDeformation = function(normalX, normalY) {
    const enableDeformationCheckbox = document.getElementById('enableDeformation');
    if (!enableDeformationCheckbox || !enableDeformationCheckbox.checked) return;
    
    if (this.isAnimating) return;

    const deformationIntensity = parseFloat(document.getElementById('deformationIntensity').value);
    const deformationSpeed = parseFloat(document.getElementById('deformationSpeed').value);
    const deformationEaseOverride = document.getElementById('deformationEaseOverride').value;
    const deformationEase = deformationEaseOverride || document.getElementById('deformationEase').value;
    
    const buffer = 2; 
    if (normalX === -1 && this.x > width - this.size - buffer) {
        this.x = width - this.size - buffer;
    } else if (normalX === 1 && this.x < this.size - buffer) {
        this.x = this.size + buffer;
    } else if (normalY === -1 && this.y > height - this.size - buffer) {
        this.y = height - this.size - buffer;
    } else if (normalY === 1 && this.y < this.size - buffer) {
        this.y = this.size + buffer;
    }
    
    const velocityMagnitude = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
    const impactIntensity = Math.pow(Math.min(velocityMagnitude / 18, 1), 2) * deformationIntensity;
    
    const maxDeformation = 0.6; 
    const deformationAmount = Math.min(impactIntensity, maxDeformation);

    const animationDuration = deformationSpeed / (1 + impactIntensity * 2);

    this.deformAngle = Math.atan2(normalY, normalX);
    
    const compressionRatio = 1 - deformationAmount;
    const stretchRatio = 1 / compressionRatio; // Better volume preservation
    
    this.isAnimating = true;
    
    const timeline = gsap.timeline({
        onComplete: () => {
            this.isAnimating = false;
            this.lastAnimationTime = Date.now();
            // Reset scaling precisely
            this.scaleX = 1;
            this.scaleY = 1;
        }
    });
    
    timeline
        .to(this, {
            scaleX: normalX !== 0 ? compressionRatio : stretchRatio,
            scaleY: normalY !== 0 ? compressionRatio : stretchRatio,
            duration: animationDuration,
            ease: "power3.out"
        })
        .to(this, {
            scaleX: 1,
            scaleY: 1,
            duration: animationDuration * 5, // A quick but smooth recovery
            ease: deformationEase // Tighter elastic effect
        });
}

// Add event listeners for the controls
window.addEventListener('load', function() {
    const controlsPanel = document.getElementById('controls');
    const selectedBallControls = document.getElementById('selectedBallControls');

    // Initialize UI controls from centralized defaults (only if not already set)
    const setIfPresent = (id, value, type = 'value') => {
        const el = document.getElementById(id);
        if (!el) return;
        if (type === 'checked') el.checked = value;
        else el.value = value;
        // Trigger change/input to sync labels/handlers
        const evtName = type === 'checked' ? 'change' : 'input';
        el.dispatchEvent(new Event(evtName));
    };

    // Simulation
    setIfPresent('bounceSpeed', DEFAULTS.bounceSpeed);
    setIfPresent('enableGravity', DEFAULTS.enableGravity, 'checked');
    setIfPresent('gravityStrength', DEFAULTS.gravityStrength);

    // Objects
    setIfPresent('ballShape', DEFAULTS.ballShape);
    setIfPresent('ballSize', DEFAULTS.ballSize);
    setIfPresent('ballVelocity', DEFAULTS.ballVelocity);
    // ballCount uses logarithmic mapping; set slider to reflect DEFAULTS.ballCount
    const ballCountSliderInit = document.getElementById('ballCount');
    if (ballCountSliderInit) {
        ballCountSliderInit.value = inverseLogarithmicSlider(DEFAULTS.ballCount, 3, 500);
        ballCountSliderInit.dispatchEvent(new Event('input'));
    }

    // Deformation
    setIfPresent('enableDeformation', DEFAULTS.deformation.enabled, 'checked');
    setIfPresent('deformationIntensity', DEFAULTS.deformation.intensity);
    setIfPresent('deformationSpeed', DEFAULTS.deformation.speed);
    setIfPresent('deformationEase', DEFAULTS.deformation.ease);
    setIfPresent('deformationEaseOverride', DEFAULTS.deformation.easeOverride);

    // Visuals
    setIfPresent('backgroundColor', DEFAULTS.visuals.backgroundColor);
    setIfPresent('trailOpacity', DEFAULTS.visuals.trailOpacity);
    setIfPresent('uiOpacity', DEFAULTS.visuals.uiOpacity);

    // Gameplay
    setIfPresent('enableScoring', DEFAULTS.gameplay.scoring, 'checked');
    setIfPresent('sandboxMode', DEFAULTS.gameplay.sandbox, 'checked');
    setIfPresent('enableHealthSystem', DEFAULTS.gameplay.healthSystem, 'checked');
    setIfPresent('healthDamageMultiplier', DEFAULTS.gameplay.healthDamageMultiplier);

    // Update deformation intensity display
    const deformationIntensitySlider = document.getElementById('deformationIntensity');
    const deformationIntensityValue = document.getElementById('deformationIntensityValue');
    if (deformationIntensitySlider && deformationIntensityValue) {
        deformationIntensitySlider.addEventListener('input', function() {
            deformationIntensityValue.textContent = this.value;
        });
    }

    // Update deformation speed display
    const deformationSpeedSlider = document.getElementById('deformationSpeed');
    const deformationSpeedValue = document.getElementById('deformationSpeedValue');
    if (deformationSpeedSlider && deformationSpeedValue) {
        deformationSpeedSlider.addEventListener('input', function() {
            deformationSpeedValue.textContent = this.value;
        });
    }

    // Update animation speed display
    const speedSlider = document.getElementById('bounceSpeed');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', function() {
            speedValue.textContent = this.value + 'x';
        });
    }

    // Update ball size display and resize existing balls
    const ballSizeSlider = document.getElementById('ballSize');
    const ballSizeValue = document.getElementById('ballSizeValue');
    if (ballSizeSlider && ballSizeValue) {
        ballSizeSlider.addEventListener('input', function() {
            ballSizeValue.textContent = this.value + 'px';
        });
    }

    // Update ball count display and adjust number of balls
    const ballCountSlider = document.getElementById('ballCount');
    const ballCountValue = document.getElementById('ballCountValue');

    if (ballCountSlider && ballCountValue) {
        // Set initial value from the slider
        const initialLogValue = logarithmicSlider(ballCountSlider.value, 3, 500);
        ballCountValue.textContent = initialLogValue;
        adjustBallCount(initialLogValue);

        ballCountSlider.addEventListener('input', function() {
            const logarithmicValue = logarithmicSlider(this.value, 3, 500);
            ballCountValue.textContent = logarithmicValue;
            adjustBallCount(logarithmicValue);
        });
    }

    // Update ball velocity display and apply to existing balls
    const ballVelocitySlider = document.getElementById('ballVelocity');
    const ballVelocityValue = document.getElementById('ballVelocityValue');
    if (ballVelocitySlider && ballVelocityValue) {
        ballVelocitySlider.addEventListener('input', function() {
            ballVelocityValue.textContent = this.value;
            adjustBallVelocities(parseInt(this.value));
        });
    }

    // Update gravity strength display
    const gravitySlider = document.getElementById('gravityStrength');
    const gravityValue = document.getElementById('gravityValue');
    if (gravitySlider && gravityValue) {
        gravitySlider.addEventListener('input', function() {
            gravityValue.textContent = this.value;
        });
    }

    // Background color picker
    const backgroundColorInput = document.getElementById('backgroundColor');
    if (backgroundColorInput) {
        backgroundColorInput.addEventListener('input', function() {
            currentBackgroundColor = this.value;
        });
    }

    // Trail Opacity slider
    const trailOpacitySlider = document.getElementById('trailOpacity');
    const trailOpacityValue = document.getElementById('trailOpacityValue');
    if (trailOpacitySlider && trailOpacityValue) {
        // Initialize currentClearAlpha based on initial slider value
        currentClearAlpha = 1 - (parseFloat(trailOpacitySlider.value) * 0.9); // Map [0,1] to [1, 0.1]
        trailOpacityValue.textContent = trailOpacitySlider.value;

        trailOpacitySlider.addEventListener('input', function() {
            currentClearAlpha = 1 - (parseFloat(this.value) * 0.9); // Map [0,1] to [1, 0.1]
            trailOpacityValue.textContent = this.value;
        });
    }

    // UI Opacity slider
    const uiOpacitySlider = document.getElementById('uiOpacity');
    const uiOpacityValue = document.getElementById('uiOpacityValue');

    if (uiOpacitySlider && uiOpacityValue && controlsPanel && selectedBallControls) {
        uiOpacitySlider.addEventListener('input', function() {
            const opacity = this.value;
            uiOpacityValue.textContent = opacity;
            controlsPanel.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
            selectedBallControls.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
        });
    }

    const enableScoringCheckbox = document.getElementById('enableScoring');
    if (enableScoringCheckbox) {
        enableScoringCheckbox.addEventListener('change', function() {
            scoringEnabled = this.checked;
            if (!scoringEnabled && selectedBall) {
                selectedBall.collisionCount = 0;
                selectedBallCollisionCount.textContent = '0';
            }
        });
    }

    const sandboxModeCheckbox = document.getElementById('sandboxMode');
    if (sandboxModeCheckbox) {
        sandboxModeCheckbox.addEventListener('change', function() {
            sandboxModeEnabled = this.checked;
        });
    }

    const enableHealthSystemCheckbox = document.getElementById('enableHealthSystem');
    if (enableHealthSystemCheckbox) {
        enableHealthSystemCheckbox.addEventListener('change', function() {
            healthSystemEnabled = this.checked;
        });
    }

    const healthDamageMultiplierSlider = document.getElementById('healthDamageMultiplier');
    const healthDamageMultiplierValue = document.getElementById('healthDamageMultiplierValue');
    if (healthDamageMultiplierSlider && healthDamageMultiplierValue) {
        healthDamageMultiplierSlider.addEventListener('input', function() {
            healthDamageMultiplierValue.textContent = this.value;
        });
    }

    // Add ball button
    const addBallButton = document.getElementById('addBall');
    if (addBallButton) {
        addBallButton.addEventListener('click', function() {
            addNewBall();
            updateBallCountSlider();
        });
    }

    // Remove ball button
    const removeBallButton = document.getElementById('removeBall');
    if (removeBallButton) {
        removeBallButton.addEventListener('click', function() {
            if (balls.length > 1) {
                balls.pop();
                updateBallCountSlider();
            }
        });
    }

    // Reset balls button
    const resetBallsButton = document.getElementById('resetBalls');
    if (resetBallsButton) {
        resetBallsButton.addEventListener('click', function() {
            resetAllBalls();
        });
    }

    // Toggle controls button
    const toggleControlsButton = document.getElementById('toggleControls');
    if (toggleControlsButton && controlsPanel) {
        // Initialize button state to match hidden panel
        toggleControlsButton.style.background = 'rgba(0, 0, 0, 0.5)';
        toggleControlsButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        toggleControlsButton.title = 'Show Controls';
        
        toggleControlsButton.addEventListener('click', function() {
            const isVisible = controlsPanel.style.display !== 'none';
            
            if (isVisible) {
                // Hide controls
                controlsPanel.style.display = 'none';
                toggleControlsButton.style.background = 'rgba(0, 0, 0, 0.5)';
                toggleControlsButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                toggleControlsButton.title = 'Show Controls';
            } else {
                // Show controls
                controlsPanel.style.display = 'block';
                toggleControlsButton.style.background = 'rgba(0, 0, 0, 0.7)';
                toggleControlsButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                toggleControlsButton.title = 'Hide Controls';
            }
        });
    }

    // Color Scheme Manager
    const schemeNameInput = document.getElementById('schemeName');
    const saveSchemeButton = document.getElementById('saveScheme');
    const schemeSelect = document.getElementById('schemeSelect');
    const loadSchemeButton = document.getElementById('loadScheme');
    const deleteSchemeButton = document.getElementById('deleteScheme');

    // Saved Balls Manager
    const savedBallsSelect = document.getElementById('savedBallsSelect');
    const saveBallButton = document.getElementById('saveBall');

    // Physics Scheme Manager
    const physicsSchemeNameInput = document.getElementById('physicsSchemeName');
    const savePhysicsSettingsButton = document.getElementById('savePhysicsSettings');
    const physicsSchemeSelect = document.getElementById('physicsSchemeSelect');
    const loadPhysicsSettingsButton = document.getElementById('loadPhysicsSettings');
    const deletePhysicsSettingsButton = document.getElementById('deletePhysicsSettings');
    const loadBallButton = document.getElementById('loadBall');
    const deleteBallButton = document.getElementById('deleteBall');

    

    function getSchemes() {
        return JSON.parse(localStorage.getItem('colorSchemes')) || {};
    }

    function populateSchemes() {
        const schemes = getSchemes();
        schemeSelect.innerHTML = '';
        for (const name in schemes) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            schemeSelect.appendChild(option);
        }
    }

    function getSavedBalls() {
        return JSON.parse(localStorage.getItem('savedBalls')) || {};
    }

    function populateSavedBalls() {
        const savedBalls = getSavedBalls();
        savedBallsSelect.innerHTML = '';
        for (const name in savedBalls) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            savedBallsSelect.appendChild(option);
        }
    }

    // Physics Scheme Functions
    function getPhysicsSettings() {
        return {
            gravityStrength: parseFloat(document.getElementById('gravityStrength').value),
            ballSize: parseInt(document.getElementById('ballSize').value),
            ballVelocity: parseInt(document.getElementById('ballVelocity').value),
            ballCount: parseInt(document.getElementById('ballCount').value),
            deformationIntensity: parseFloat(document.getElementById('deformationIntensity').value),
            deformationSpeed: parseFloat(document.getElementById('deformationSpeed').value),
            deformationEase: document.getElementById('deformationEase').value,
            deformationEaseOverride: document.getElementById('deformationEaseOverride').value,
            enableDeformation: document.getElementById('enableDeformation').checked,
            enableScoring: document.getElementById('enableScoring').checked,
            sandboxMode: document.getElementById('sandboxMode').checked,
            enableHealthSystem: document.getElementById('enableHealthSystem').checked,
            healthDamageMultiplier: parseFloat(document.getElementById('healthDamageMultiplier').value),
            bounceSpeed: parseFloat(document.getElementById('bounceSpeed').value),
            trailOpacity: parseFloat(document.getElementById('trailOpacity').value),
            uiOpacity: parseFloat(document.getElementById('uiOpacity').value)
        };
    }

    function applyPhysicsSettings(settings) {
        document.getElementById('gravityStrength').value = settings.gravityStrength;
        document.getElementById('ballSize').value = settings.ballSize;
        document.getElementById('ballVelocity').value = settings.ballVelocity;
        document.getElementById('ballCount').value = settings.ballCount;
        document.getElementById('deformationIntensity').value = settings.deformationIntensity;
        document.getElementById('deformationSpeed').value = settings.deformationSpeed;
        document.getElementById('deformationEase').value = settings.deformationEase;
        document.getElementById('deformationEaseOverride').value = settings.deformationEaseOverride;
        document.getElementById('enableDeformation').checked = settings.enableDeformation;
        document.getElementById('enableScoring').checked = settings.enableScoring;
        document.getElementById('sandboxMode').checked = settings.sandboxMode;
        document.getElementById('enableHealthSystem').checked = settings.enableHealthSystem;
        document.getElementById('healthDamageMultiplier').value = settings.healthDamageMultiplier;
        document.getElementById('bounceSpeed').value = settings.bounceSpeed;
        document.getElementById('trailOpacity').value = settings.trailOpacity;
        document.getElementById('uiOpacity').value = settings.uiOpacity;

        // Trigger input events to update displays and apply changes
        document.getElementById('gravityStrength').dispatchEvent(new Event('input'));
        document.getElementById('ballSize').dispatchEvent(new Event('input'));
        document.getElementById('ballVelocity').dispatchEvent(new Event('input'));
        document.getElementById('ballCount').dispatchEvent(new Event('input'));
        document.getElementById('deformationIntensity').dispatchEvent(new Event('input'));
        document.getElementById('deformationSpeed').dispatchEvent(new Event('input'));
        document.getElementById('deformationEase').dispatchEvent(new Event('input'));
        document.getElementById('deformationEaseOverride').dispatchEvent(new Event('input'));
        document.getElementById('enableDeformation').dispatchEvent(new Event('change'));
        document.getElementById('enableScoring').dispatchEvent(new Event('change'));
        document.getElementById('sandboxMode').dispatchEvent(new Event('change'));
        document.getElementById('enableHealthSystem').dispatchEvent(new Event('change'));
        document.getElementById('healthDamageMultiplier').dispatchEvent(new Event('input')); // Added this line
        document.getElementById('bounceSpeed').dispatchEvent(new Event('input'));
        document.getElementById('trailOpacity').dispatchEvent(new Event('input'));
        document.getElementById('uiOpacity').dispatchEvent(new Event('input'));
    }

    function getPhysicsSchemes() {
        return JSON.parse(localStorage.getItem('physicsSchemes')) || {};
    }

    function populatePhysicsSchemes() {
        const schemes = getPhysicsSchemes();
        physicsSchemeSelect.innerHTML = '';
        for (const name in schemes) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            physicsSchemeSelect.appendChild(option);
        }
    }

    savePhysicsSettingsButton.addEventListener('click', () => {
        const name = physicsSchemeNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for your physics scheme.');
            return;
        }

        const schemes = getPhysicsSchemes();
        schemes[name] = getPhysicsSettings();
        localStorage.setItem('physicsSchemes', JSON.stringify(schemes));
        populatePhysicsSchemes();
        physicsSchemeNameInput.value = '';
    });

    loadPhysicsSettingsButton.addEventListener('click', () => {
        const name = physicsSchemeSelect.value;
        if (!name) {
            alert('Please select a physics scheme to load.');
            return;
        }

        const schemes = getPhysicsSchemes();
        const settings = schemes[name];
        if (settings) {
            applyPhysicsSettings(settings);
        }
    });

    deletePhysicsSettingsButton.addEventListener('click', () => {
        const name = physicsSchemeSelect.value;
        if (!name) {
            alert('Please select a physics scheme to delete.');
            return;
        }

        const schemes = getPhysicsSchemes();
        delete schemes[name];
        localStorage.setItem('physicsSchemes', JSON.stringify(schemes));
        populatePhysicsSchemes();
    });

    saveSchemeButton.addEventListener('click', () => {
        const name = schemeNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the scheme.');
            return;
        }

        const schemes = getSchemes();
        schemes[name] = {
            backgroundColor: document.getElementById('backgroundColor').value,
            ballColors: balls.map(ball => ball.originalColor)
        };

        localStorage.setItem('colorSchemes', JSON.stringify(schemes));
        populateSchemes();
        schemeNameInput.value = '';
    });

    loadSchemeButton.addEventListener('click', () => {
        const name = schemeSelect.value;
        if (!name) {
            alert('Please select a scheme to load.');
            return;
        }

        const schemes = getSchemes();
        const scheme = schemes[name];

        if (scheme) {
            document.getElementById('backgroundColor').value = scheme.backgroundColor;
            currentBackgroundColor = scheme.backgroundColor;

            // Apply colors to existing balls
            for (let i = 0; i < balls.length; i++) {
                if (scheme.ballColors[i]) {
                    balls[i].color = scheme.ballColors[i];
                    balls[i].originalColor = scheme.ballColors[i];
                }
            }
        }
    });

    deleteSchemeButton.addEventListener('click', () => {
        const name = schemeSelect.value;
        if (!name) {
            alert('Please select a scheme to delete.');
            return;
        }

        const schemes = getSchemes();
        delete schemes[name];
        localStorage.setItem('colorSchemes', JSON.stringify(schemes));
        populateSchemes();
    });

    saveBallButton.addEventListener('click', () => {
        if (!selectedBall) {
            alert('Please select a ball to save.');
            return;
        }

        const name = prompt('Enter a name for your ball:');
        if (!name) {
            return;
        }

        const savedBalls = getSavedBalls();
        savedBalls[name] = {
            x: selectedBall.x,
            y: selectedBall.y,
            velX: selectedBall.velX,
            velY: selectedBall.velY,
            color: selectedBall.color,
            size: selectedBall.size,
            shape: selectedBall.shape,
            health: selectedBall.health,
            collisionCount: selectedBall.collisionCount,
            _lastMultiplier: selectedBall._lastMultiplier
        };

        localStorage.setItem('savedBalls', JSON.stringify(savedBalls));
        populateSavedBalls();
    });

    loadBallButton.addEventListener('click', () => {
        const name = savedBallsSelect.value;
        if (!name) {
            alert('Please select a ball to load.');
            return;
        }

        const savedBalls = getSavedBalls();
        const ballData = savedBalls[name];

        if (ballData) {
            if (selectedBall) {
                selectedBall.x = ballData.x;
                selectedBall.y = ballData.y;
                selectedBall.velX = ballData.velX;
                selectedBall.velY = ballData.velY;
                selectedBall.color = ballData.color;
                selectedBall.size = ballData.size;
                selectedBall.shape = ballData.shape;
                selectedBall.health = ballData.health;
                selectedBall.collisionCount = ballData.collisionCount;
                selectedBall._lastMultiplier = ballData._lastMultiplier;
            } else {
                const newBall = new Ball(
                    ballData.x,
                    ballData.y,
                    ballData.velX,
                    ballData.velY,
                    ballData.color,
                    ballData.size,
                    ballData.shape
                );
                newBall.health = ballData.health;
                newBall.collisionCount = ballData.collisionCount;
                newBall._lastMultiplier = ballData._lastMultiplier;
                balls.push(newBall);
                updateBallCountSlider();
            }
        }
    });

    deleteBallButton.addEventListener('click', () => {
        const name = savedBallsSelect.value;
        if (!name) {
            alert('Please select a ball to delete.');
            return;
        }

        const savedBalls = getSavedBalls();
        delete savedBalls[name];
        localStorage.setItem('savedBalls', JSON.stringify(savedBalls));
        populateSavedBalls();
    });

    populateSchemes();
    populateSavedBalls();
    populatePhysicsSchemes();

    // Selected ball controls event handlers
    if (selectedBallShapeSelect) {
        selectedBallShapeSelect.addEventListener('change', function() {
            if (selectedBall) {
                selectedBall.shape = this.value;
                // Reset rotation and rotation speed for new shape
                selectedBall.rotation = 0;
                selectedBall.rotationSpeed = (Math.random() - 0.5) * 0.02;
            }
        });
    }

    if (selectedBallSpeedMultiplierInput && selectedBallSpeedMultiplierValue) {
        selectedBallSpeedMultiplierInput.addEventListener('input', function() {
            if (selectedBall) {
                const newMultiplier = parseFloat(this.value);
                selectedBallSpeedMultiplierValue.textContent = newMultiplier + 'x';
                
                // Apply the new multiplier to the ball's current velocity
                if (selectedBall._lastMultiplier) {
                    // First, remove the previous multiplier effect
                    selectedBall.velX /= selectedBall._lastMultiplier;
                    selectedBall.velY /= selectedBall._lastMultiplier;
                }
                
                // Apply the new multiplier
                selectedBall.velX *= newMultiplier;
                selectedBall.velY *= newMultiplier;
                selectedBall._lastMultiplier = newMultiplier;
            }
        });
    }

    

    if (resetSelectedBallButton) {
        resetSelectedBallButton.addEventListener('click', function() {
            if (selectedBall) {
                selectedBall.color = selectedBall.originalColor;
                selectedBall.size = selectedBall.originalSize;
                selectedBall.shape = DEFAULTS.ballShape; // Reset to default shape
                selectedBall.rotation = 0; // Reset rotation
                selectedBall.rotationSpeed = (Math.random() - 0.5) * 0.02; // Reset rotation speed
                selectedBall.velX = random(-DEFAULTS.ballVelocity, DEFAULTS.ballVelocity); // Reset to default velocity range
                selectedBall.velY = random(-DEFAULTS.ballVelocity, DEFAULTS.ballVelocity);
                selectedBall.health = 100; // Reset health to full
                selectedBall._lastMultiplier = 1; // Reset speed multiplier
                
                // Update UI controls
                selectedBallSpeedMultiplierInput.value = 1;
                selectedBallSpeedMultiplierValue.textContent = '1x';
                selectedBallShapeSelect.value = DEFAULTS.ballShape; // Reset shape selector
                updateSelectedBallHealth();
            }
        });
    }
    setTimeout(initializeBalls, 100);
});

// Helper functions for ball management
function resizeAllBalls(newSize) {
    balls.forEach(ball => {
        const ratio = newSize / ball.originalSize;
        ball.size = newSize;
        ball.originalSize = newSize;
        
        // Keep balls within bounds after resizing
        if (ball.x - ball.size < 0) ball.x = ball.size;
        if (ball.x + ball.size > width) ball.x = width - ball.size;
        if (ball.y - ball.size < 0) ball.y = ball.size;
        if (ball.y + ball.size > height) ball.y = height - ball.size;
    });
}

function adjustBallCount(targetCount) {
    while (balls.length < targetCount) {
        addNewBall();
    }
    while (balls.length > targetCount && balls.length > 1) {
        balls.pop();
    }
}

function adjustBallVelocities(maxVelocity) {
    balls.forEach(ball => {
        // Get current velocity magnitude
        const currentSpeed = Math.sqrt(ball.velX * ball.velX + ball.velY * ball.velY);
        
        if (currentSpeed > 0) {
            // Preserve direction but adjust magnitude
            const ratio = maxVelocity / currentSpeed;
            ball.velX *= ratio;
            ball.velY *= ratio;
        } else {
            // If ball is stationary, give it a random velocity within the new max range
            ball.velX = random(-maxVelocity, maxVelocity);
            ball.velY = random(-maxVelocity, maxVelocity);
        }
    });
}

function addNewBall(x = null, y = null) {
    const ballSize = parseInt(document.getElementById('ballSize')?.value || DEFAULTS.ballSize);
    const ballVelocity = parseInt(document.getElementById('ballVelocity')?.value || DEFAULTS.ballVelocity);
    const size = ballSize;
    
    let attempts = 0;
    let newX = x;
    let newY = y;
    let validPosition = false;

    if (newX === null || newY === null) {
        // Try to find a position that doesn't overlap with existing balls
        while (!validPosition && attempts < 50) {
            newX = random(size, width - size);
            newY = random(size, height - size);
            
            validPosition = true;
            for (let ball of balls) {
                const distance = Math.sqrt((newX - ball.x) ** 2 + (newY - ball.y) ** 2);
                if (distance < size + ball.size + 10) // Add buffer
                {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }
        
        // If couldn't find non-overlapping position, just place it anyway
        if (!validPosition) {
            newX = random(size, width - size);
            newY = random(size, height - size);
        }
    }
    
    const ballShape = document.getElementById('ballShape')?.value || DEFAULTS.ballShape;
    
    const ball = new Ball(
        newX, newY,
        random(-ballVelocity, ballVelocity),
        random(-ballVelocity, ballVelocity),
        'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
        size,
        ballShape
    );
    ball._lastMultiplier = 1; // Initialize speed multiplier tracking
    balls.push(ball);
}

function updateBallCountSlider() {
    const ballCountSlider = document.getElementById('ballCount');
    const ballCountValue = document.getElementById('ballCountValue');
    if (ballCountSlider && ballCountValue) {
        ballCountSlider.value = inverseLogarithmicSlider(balls.length, 3, 500);
        ballCountValue.textContent = balls.length;
    }
}

function resetAllBalls() {
    balls.length = 0; // Clear existing balls
    globalScore = 0; // Reset global score
    updateGlobalScoreDisplay(); // Update display
    
    const ballSize = parseInt(document.getElementById('ballSize')?.value || DEFAULTS.ballSize);
    const ballCount = parseInt(document.getElementById('ballCountValue')?.textContent || DEFAULTS.ballCount);
    const ballVelocity = parseInt(document.getElementById('ballVelocity')?.value || DEFAULTS.ballVelocity);
    const ballShape = document.getElementById('ballShape')?.value || DEFAULTS.ballShape;
    
    // Create new balls with current settings
    while (balls.length < ballCount) {
        const size = ballSize;
        // Mix of shapes or use selected shape
        const shapeToUse = ballShape === 'mixed' ? 
            ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'star'][Math.floor(Math.random() * 8)] :
            ballShape;
            
        const ball = new Ball(
            random(0 + size, width - size),
            random(0 + size, height - size),
            random(-ballVelocity, ballVelocity),
            random(-ballVelocity, ballVelocity),
            'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
            size,
            shapeToUse
        );
        ball._lastMultiplier = 1; // Initialize speed multiplier tracking
        balls.push(ball);
    }
}

// Add mouse interaction variables
let selectedBall = null;
let isDragging = false; // New flag to indicate if a ball is being dragged
let mouseX = 0;
let mouseY = 0;
let lastMousePositions = [];

// Get references to the new selected ball controls
const selectedBallControls = document.getElementById('selectedBallControls');
const selectedBallColorInput = document.getElementById('selectedBallColor');
const selectedBallSizeInput = document.getElementById('selectedBallSize');
const selectedBallSizeValue = document.getElementById('selectedBallSizeValue');
const selectedBallVelocityInput = document.getElementById('selectedBallVelocity');
const selectedBallVelocityValue = document.getElementById('selectedBallVelocityValue');
const selectedBallSpeedInput = document.getElementById('selectedBallSpeed');
const selectedBallSpeedValue = document.getElementById('selectedBallSpeedValue');
const selectedBallSpeedMultiplierInput = document.getElementById('selectedBallSpeedMultiplier');
const selectedBallSpeedMultiplierValue = document.getElementById('selectedBallSpeedMultiplierValue');
const selectedBallCollisionCount = document.getElementById('selectedBallCollisionCount');

const selectedBallHealth = document.getElementById('selectedBallHealth');
const enableDiagnostics = document.getElementById('enableDiagnostics');
const resetSelectedBallButton = document.getElementById('resetSelectedBall');


// Helper to convert RGB to Hex for color input
function rgbToHex(rgb) {
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) return '#000000'; // Default to black if format is unexpected
    const toHex = (c) => {
        const hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(rgbMatch[1]) + toHex(rgbMatch[2]) + toHex(rgbMatch[3]);
}

// Mouse event listeners
canvas.addEventListener('mousedown', function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMousePositions = [];

    let ballClicked = false;
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
        if (distance < ball.size) {
            selectedBall = ball;
            isDragging = true; // Start dragging
            selectedBall.velX = 0;
            selectedBall.velY = 0;

            // Show and populate selected ball controls
            selectedBallControls.style.display = 'block';
            selectedBallColorInput.value = rgbToHex(selectedBall.color);
            selectedBallSizeInput.value = selectedBall.size;
            selectedBallSizeValue.textContent = selectedBall.size + 'px';
            selectedBallVelocityInput.value = Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY);
            selectedBallVelocityValue.textContent = selectedBallVelocityInput.value;
            selectedBallSpeedInput.value = Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY);
            selectedBallSpeedValue.textContent = selectedBallSpeedInput.value;
            
            // Update gamification info
            updateSelectedBallInfo();
            selectedBallSpeedMultiplierInput.value = selectedBall._lastMultiplier || 1;
            selectedBallSpeedMultiplierValue.textContent = (selectedBall._lastMultiplier || 1) + 'x';
            selectedBallCollisionCount.textContent = selectedBall.collisionCount;
            selectedBallHealth.textContent = Math.round(selectedBall.health);
            
            selectedBallShapeSelect.value = selectedBall.shape || DEFAULTS.ballShape;
            
            ballClicked = true;
            break;
        }
    }

    if (!ballClicked) {
        if (selectedBall) {
            // Clicked outside a ball, deselect current ball
            selectedBall = null;
            selectedBallControls.style.display = 'none';
        } else {
            // Clicked on empty space, add a new ball
            addNewBall(mouseX, mouseY);
            updateBallCountSlider();
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (selectedBall && isDragging) {
        const newMouseX = e.clientX;
        const newMouseY = e.clientY;

        selectedBall.x = newMouseX;
        selectedBall.y = newMouseY;

        // Store the last few mouse positions to calculate velocity
        lastMousePositions.push({ x: newMouseX, y: newMouseY });
        if (lastMousePositions.length > 5) {
            lastMousePositions.shift();
        }
    }
});

canvas.addEventListener('mouseup', function() {
    if (selectedBall && isDragging) {
        if (lastMousePositions.length > 1) {
            const firstPos = lastMousePositions[0];
            const lastPos = lastMousePositions[lastMousePositions.length - 1];
            const dx = lastPos.x - firstPos.x;
            const dy = lastPos.y - firstPos.y;
            selectedBall.velX = dx * 0.5;
            selectedBall.velY = dy * 0.5;
        }
        isDragging = false;
    }
});

// Add event listeners for selected ball controls
selectedBallColorInput.addEventListener('input', function() {
    if (selectedBall) {
        selectedBall.color = this.value;
        selectedBall.originalColor = this.value; // Update original color too
    }
});

selectedBallSizeInput.addEventListener('input', function() {
    if (selectedBall) {
        const newSize = parseInt(this.value);
        selectedBall.size = newSize;
        selectedBall.originalSize = newSize; // Update original size too
        selectedBallSizeValue.textContent = newSize + 'px';
    }
});

selectedBallVelocityInput.addEventListener('input', function() {
    if (selectedBall) {
        const newVelocity = parseInt(this.value);
        const currentSpeed = Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY);
        if (currentSpeed > 0) {
            const ratio = newVelocity / currentSpeed;
            selectedBall.velX *= ratio;
            selectedBall.velY *= ratio;
        } else {
            // If stationary, give it a random velocity within the new max range
            selectedBall.velX = random(-newVelocity, newVelocity);
            selectedBall.velY = random(-newVelocity, newVelocity);
        }
        selectedBallVelocityValue.textContent = newVelocity;
    }
});

selectedBallSpeedInput.addEventListener('input', function() {
    if (selectedBall) {
        const newSpeed = parseInt(this.value);
        const currentSpeed = Math.sqrt(selectedBall.velX * selectedBall.velX + selectedBall.velY * selectedBall.velY);
        if (currentSpeed > 0) {
            const ratio = newSpeed / currentSpeed;
            selectedBall.velX *= ratio;
            selectedBall.velY *= ratio;
        } else {
            // If stationary, give it a random velocity with the new speed
            selectedBall.velX = random(-newSpeed, newSpeed);
            selectedBall.velY = random(-newSpeed, newSpeed);
        }
        selectedBallSpeedValue.textContent = newSpeed;
    }
});




// Update selected ball info display
function updateSelectedBallInfo() {
    if (!selectedBall) return;
    
    if (selectedBallCollisionCount) {
        selectedBallCollisionCount.textContent = selectedBall.collisionCount || '0';
    }
    if (selectedBallHealth) {
        selectedBallHealth.textContent = Math.round(selectedBall.health || 100);
    }
    if (selectedBallSpeedMultiplierInput) {
        selectedBallSpeedMultiplierInput.value = selectedBall._lastMultiplier || 1;
    }
    if (selectedBallSpeedMultiplierValue) {
        selectedBallSpeedMultiplierValue.textContent = (selectedBall._lastMultiplier || 1) + 'x';
    }
}

Ball.prototype.update = function() {
    // Apply gravity if enabled
    const enableGravityCheckbox = document.getElementById('enableGravity');
    if (enableGravityCheckbox && enableGravityCheckbox.checked) {
        const gravityStrength = parseFloat(document.getElementById('gravityStrength')?.value || DEFAULTS.gravityStrength);
        this.velY += gravityStrength;
    }

    // If ball is being grabbed, don't apply other physics
    
    // Add collision with controls panel (desktop only)
    const controlsPanel = document.getElementById('controls');
    const isMobileViewport = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : (window.innerWidth <= 768);
    if (!isMobileViewport && controlsPanel && controlsPanel.style.display !== 'none') {
        const panelRect = controlsPanel.getBoundingClientRect();

        // Find the closest point on the panel to the ball's center
        let closestX = Math.max(panelRect.left, Math.min(this.x, panelRect.right));
        let closestY = Math.max(panelRect.top, Math.min(this.y, panelRect.bottom));

        // Calculate distance between the ball's center and this closest point
        const dx = this.x - closestX;
        const dy = this.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check for collision
        if (distance < this.size) {
            // Collision detected
            const overlap = this.size - distance;
            let normalX = dx / distance;
            let normalY = dy / distance;

            // If distance is zero, create a default normal
            if (isNaN(normalX) || isNaN(normalY)) {
                normalX = 1;
                normalY = 0;
            }

            // Move the ball out of the panel
            this.x += normalX * overlap;
            this.y += normalY * overlap;

            // Reflect the velocity
            const dotProduct = (this.velX * normalX + this.velY * normalY) * 2;
            this.velX -= dotProduct * normalX;
            this.velY -= dotProduct * normalY;

            // Apply deformation
            this.applyWallDeformation(normalX, normalY);
        }
    }


    // Get current velocity setting as maximum velocity
    const maxVelocity = parseInt(document.getElementById('ballVelocity')?.value || DEFAULTS.ballVelocity);
    
    // Velocity limiting based on user setting
    if (Math.abs(this.velX) > maxVelocity) {
        this.velX = this.velX > 0 ? maxVelocity : -maxVelocity;
    }
    if (Math.abs(this.velY) > maxVelocity) {
        this.velY = this.velY > 0 ? maxVelocity : -maxVelocity;
    }

    // Calculate effective radius considering current deformation
    const effectiveRadius = this.size * Math.max(this.scaleX, this.scaleY);

    // Check wall collisions with improved grazing physics
    let wallCollision = false;
    let wallNormalX = 0;
    let wallNormalY = 0;
    let isGrazingWall = false;
    
    // Right wall collision
    if ((this.x + effectiveRadius) >= width) {
        const approachSpeed = this.velX; // Speed toward wall
        isGrazingWall = Math.abs(approachSpeed) < 2; // Grazing if moving slowly toward wall
        
        if (isGrazingWall) {
            // Gentle sliding along wall
            this.velX = -Math.abs(this.velX) * 0.7; // Reduced bounce
            this.x = width - effectiveRadius - 1;
        } else {
            this.velX = -Math.abs(this.velX); // Full bounce
            this.x = width - effectiveRadius - 1;
        }
        wallCollision = true;
        wallNormalX = -1; // Normal points left
        wallNormalY = 0;
    }

    // Left wall collision
    if ((this.x - effectiveRadius) <= 0) {
        const approachSpeed = -this.velX; // Speed toward wall (negative velocity)
        isGrazingWall = Math.abs(approachSpeed) < 2;
        
        if (isGrazingWall) {
            this.velX = Math.abs(this.velX) * 0.7; // Reduced bounce
            this.x = effectiveRadius + 1;
        } else {
            this.velX = Math.abs(this.velX); // Full bounce
            this.x = effectiveRadius + 1;
        }
        wallCollision = true;
        wallNormalX = 1; // Normal points right
        wallNormalY = 0;
    }

    // Bottom wall collision
    if ((this.y + effectiveRadius) >= height) {
        const approachSpeed = this.velY; // Speed toward wall
        isGrazingWall = Math.abs(approachSpeed) < 2;
        
        if (isGrazingWall) {
            this.velY = -Math.abs(this.velY) * 0.7; // Reduced bounce
            this.y = height - effectiveRadius - 1;
        } else {
            this.velY = -Math.abs(this.velY); // Full bounce
            this.y = height - effectiveRadius - 1;
        }
        wallCollision = true;
        wallNormalX = 0;
        wallNormalY = -1; // Normal points up
    }

    // Top wall collision
    if ((this.y - effectiveRadius) <= 0) {
        const approachSpeed = -this.velY; // Speed toward wall (negative velocity)
        isGrazingWall = Math.abs(approachSpeed) < 2;
        
        if (isGrazingWall) {
            this.velY = Math.abs(this.velY) * 0.7; // Reduced bounce
            this.y = effectiveRadius + 1;
        } else {
            this.velY = Math.abs(this.velY); // Full bounce
            this.y = effectiveRadius + 1;
        }
        wallCollision = true;
        wallNormalX = 0;
        wallNormalY = 1; // Normal points down
    }

    // Apply wall collision deformation (only for non-grazing collisions)
    if (wallCollision && !isGrazingWall) {
        this.applyWallDeformation(wallNormalX, wallNormalY);
    } else if (wallCollision && isGrazingWall) {
        // Subtle visual feedback for wall grazing
        
    }

    this.x += this.velX;
    this.y += this.velY;
}

var balls = [];

// Initialize balls with default settings
function initializeBalls() {
    const ballSize = parseInt(document.getElementById('ballSize')?.value || DEFAULTS.ballSize);
    const ballCount = parseInt(document.getElementById('ballCountValue')?.textContent || DEFAULTS.ballCount);
    const ballVelocity = parseInt(document.getElementById('ballVelocity')?.value || DEFAULTS.ballVelocity);
    
    while(balls.length < ballCount) {
        const size = random(ballSize - 20, ballSize + 20);
        var ball = new Ball(
            random(0 + size, width - size),
            random(0 + size, height - size),
            random(-ballVelocity, ballVelocity),
            random(-ballVelocity, ballVelocity),
            'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
            size  
        );
        balls.push(ball);
    }
}



Ball.prototype.applyBallDeformation = function(normalX, normalY, intensity) {
    const enableDeformationCheckbox = document.getElementById('enableDeformation');
    if (!enableDeformationCheckbox || !enableDeformationCheckbox.checked) return;

    if (this.isAnimating) return;

    const deformationIntensity = parseFloat(document.getElementById('deformationIntensity').value);
    const deformationSpeed = parseFloat(document.getElementById('deformationSpeed').value);
    const deformationEaseOverride = document.getElementById('deformationEaseOverride').value;
    const deformationEase = deformationEaseOverride || document.getElementById('deformationEase').value;

    const impactIntensity = Math.pow(intensity, 2) * deformationIntensity;
    const maxDeformation = 0.6;
    const deformationAmount = Math.min(impactIntensity, maxDeformation);

    const animationDuration = deformationSpeed / (1 + intensity * 2);

    this.deformAngle = Math.atan2(normalY, normalX);

    const compressionRatio = 1 - deformationAmount;
    const stretchRatio = 1 / compressionRatio; // Approximate volume preservation

    this.isAnimating = true;

    const timeline = gsap.timeline({
        onComplete: () => {
            this.isAnimating = false;
            this.lastAnimationTime = Date.now();
            this.scaleX = 1;
            this.scaleY = 1;
        }
    });

    timeline
        .to(this, {
            scaleX: compressionRatio,
            scaleY: stretchRatio,
            duration: animationDuration,
            ease: "power3.out"
        })
        .to(this, {
            scaleX: 1,
            scaleY: 1,
            duration: animationDuration * 5,
            ease: deformationEase
        });
}

function handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY) {
    // 1. Positional Correction to prevent sinking
    const overlap = combinedRadius - distance;
    const separationFactor = overlap / 2 + 0.5; // Small buffer to prevent re-collision
    ball1.x -= normalX * separationFactor;
    ball1.y -= normalY * separationFactor;
    ball2.x += normalX * separationFactor;
    ball2.y += normalY * separationFactor;

    // 2. Velocity Resolution
    const elasticity = 0.9;
    const tangentX = -normalY;
    const tangentY = normalX;

    // Project velocities onto normal and tangent vectors
    const v1n = ball1.velX * normalX + ball1.velY * normalY;
    const v2n = ball2.velX * normalX + ball2.velY * normalY;
    const v1t = ball1.velX * tangentX + ball1.velY * tangentY;
    const v2t = ball2.velX * tangentX + ball2.velY * tangentY;

    // New normal velocities (using 1D collision formula for equal mass)
    const v1n_final = (v1n * (1 - elasticity) + 2 * v2n) / 2;
    const v2n_final = (v2n * (1 - elasticity) + 2 * v1n) / 2;

    // Convert scalar normal and tangential velocities back to vectors
    ball1.velX = v1n_final * normalX + v1t * tangentX;
    ball1.velY = v1n_final * normalY + v1t * tangentY;
    ball2.velX = v2n_final * normalX + v2t * tangentX;
    ball2.velY = v2n_final * normalY + v2t * tangentY;

    // --- Visual Feedback ---
    const relativeSpeed = Math.abs(v1n - v2n);
    const intensity = Math.min(relativeSpeed / 15, 1);

    ball1.applyBallDeformation(normalX, normalY, intensity);
    ball2.applyBallDeformation(-normalX, -normalY, intensity);

    const brighten = (ball) => {
        const baseColor = ball.originalColor.match(/\d+/g);
        if (baseColor && baseColor.length >= 3) {
            const r = Math.min(255, parseInt(baseColor[0]) + 60);
            const g = Math.min(255, parseInt(baseColor[1]) + 60);
            const b = Math.min(255, parseInt(baseColor[2]) + 60);
            return `rgb(${r}, ${g}, ${b})`;
        }
        return ball.color;
    };

    

    // --- Health System ---
    if (healthSystemEnabled) {
        const healthDamage = intensity * parseFloat(document.getElementById('healthDamageMultiplier').value); // More intense collisions cause more damage
        ball1.health -= healthDamage;
        ball2.health -= healthDamage;
        
        // Ensure health doesn't go below 0
        ball1.health = Math.max(0, ball1.health);
        ball2.health = Math.max(0, ball2.health);
        
        // Update visual representation based on health
        updateBallHealth(ball1);
        updateBallHealth(ball2);
    }
    
    // Remove balls with no health
    if (healthSystemEnabled && ball1.health <= 0 && !sandboxModeEnabled) removeBall(ball1);
    if (healthSystemEnabled && ball2.health <= 0 && !sandboxModeEnabled) removeBall(ball2);
    
    // Update collision counts if diagnostics are enabled
    if (enableScoring && enableScoring.checked) {
        // Increment global score for every collision
        globalScore++;
        updateGlobalScoreDisplay();

        if (ball1 === selectedBall) {
            selectedBall.collisionCount++;
            const collisionCountSpan = document.getElementById('selectedBallCollisionCount');
            if (collisionCountSpan) collisionCountSpan.textContent = selectedBall.collisionCount;
            updateSelectedBallHealth();
        }
        if (ball2 === selectedBall) {
            selectedBall.collisionCount++;
            const collisionCountSpan = document.getElementById('selectedBallCollisionCount');
            if (collisionCountSpan) collisionCountSpan.textContent = selectedBall.collisionCount;
            updateSelectedBallHealth();
        }
    }
}

function solveCollisions() {
    const iterations = 5;
    for (let k = 0; k < iterations; k++) {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];

                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const combinedRadius = ball1.size + ball2.size;

                if (distance < combinedRadius) {
                    const overlap = combinedRadius - distance;
                    const normalX = dx / distance;
                    const normalY = dy / distance;

                    // Separate the balls
                    ball1.x -= normalX * overlap / 2;
                    ball1.y -= normalY * overlap / 2;
                    ball2.x += normalX * overlap / 2;
                    ball2.y += normalY * overlap / 2;

                    // Wake up sleeping balls
                    if (ball1.isSleeping) ball1.isSleeping = false;
                    if (ball2.isSleeping) ball2.isSleeping = false;

                    // Dynamic friction and collision response
                    const relativeVelX = ball2.velX - ball1.velX;
                    const relativeVelY = ball2.velY - ball1.velY;
                    const relativeSpeed = Math.sqrt(relativeVelX * relativeVelX + relativeVelY * relativeVelY);

                    if (relativeSpeed > 1) {
                        // Dynamic collision response for high-speed collisions
                        handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY);
                    } else {
                        // Iterative solver for low-speed collisions (stacking)
                        const tangentX = -normalY;
                        const tangentY = normalX;
                        const tangentSpeed = relativeVelX * tangentX + relativeVelY * tangentY;
                        const friction = Math.min(0.1 * relativeSpeed, 0.1);
                        const frictionImpulse = tangentSpeed * friction;
                        ball1.velX += tangentX * frictionImpulse;
                        ball1.velY += tangentY * frictionImpulse;
                        ball2.velX -= tangentX * frictionImpulse;
                        ball2.velY -= tangentY * frictionImpulse;
                    }
                }
            }
        }
    }
}

// Health system functions
function updateBallHealth(ball) {
    const healthRatio = ball.health / ball.maxHealth;
    
    // Update color based on health (fade to white as health decreases)
    if (healthSystemEnabled) {
        
    }
    
    // Update size based on health (shrink as health decreases)
    ball.size = ball.originalSize * (0.5 + 0.5 * healthRatio);
}

function removeBall(ball) {
    const index = balls.indexOf(ball);
    if (index > -1) {
        balls.splice(index, 1);
        
        // If this was the selected ball, deselect it
        if (selectedBall === ball) {
            selectedBall = null;
            const selectedBallControls = document.getElementById('selectedBallControls');
            if (selectedBallControls) selectedBallControls.style.display = 'none';
        }
        
        updateBallCountSlider();
    }
}

function updateSelectedBallHealth() {
    if (selectedBall) {
        const healthSpan = document.getElementById('selectedBallHealth');
        if (healthSpan) {
            healthSpan.textContent = Math.round(selectedBall.health);
        }
    }
}

function updateGlobalScoreDisplay() {
    const globalScoreSpan = document.getElementById('globalScoreDisplay');
    if (globalScoreSpan) {
        globalScoreSpan.textContent = globalScore;
    }
}

function detectCollisions() {
    const currentTime = Date.now();
    
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ball1 = balls[i];
            const ball2 = balls[j];
            
            if (currentTime - ball1.lastCollisionTime < 20 || currentTime - ball2.lastCollisionTime < 20) {
                continue;
            }
            
            const dx = ball2.x - ball1.x;
            const dy = ball2.y - ball1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const combinedRadius = ball1.size + ball2.size;

            if (distance < combinedRadius && distance > 0) {
                const normalX = dx / distance;
                const normalY = dy / distance;

                const relativeVelX = ball1.velX - ball2.velX;
                const relativeVelY = ball1.velY - ball2.velY;
                const velAlongNormal = relativeVelX * normalX + relativeVelY * normalY;

                if (velAlongNormal > 0) {
                    ball1.lastCollisionTime = currentTime;
                    ball2.lastCollisionTime = currentTime;
                    handleBallCollision(ball1, ball2, dx, dy, distance, combinedRadius, normalX, normalY);
                }
            }
        }
    }
}

//ctx.fillStyle = 'blue';
//ctx.fillRect(0,0, width, height);

// Animation control variables
let animationId;
let isAnimationRunning = true;

let currentBackgroundColor = DEFAULTS.visuals.backgroundColor; // Default background color
let currentClearAlpha = 1; // Default to no trail (fully opaque clear)

function loop() {
    if (!isAnimationRunning) return; // Don't continue if animation is paused

    // Create a temporary canvas to get the rgba value of the current background color
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.fillStyle = currentBackgroundColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const imageData = tempCtx.getImageData(0, 0, 1, 1).data;
    
    ctx.fillStyle = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentClearAlpha})`;
    ctx.fillRect(0, 0, width, height);

    for (var i = 0; i < balls.length; i++) {
        const ball = balls[i];

        if (ball.isSleeping) {
            ball.draw();
            continue;
        }

        ball.draw();
        ball.update();

        // Safety check: ensure balls stay within bounds considering deformation
        const effectiveRadius = ball.size * Math.max(ball.scaleX, ball.scaleY);
        const minPos = effectiveRadius + 2;
        const maxPosX = width - effectiveRadius - 2;
        const maxPosY = height - effectiveRadius - 2;

        if (ball.x < minPos) {
            ball.x = minPos;
            ball.velX = Math.abs(ball.velX);
        } else if (ball.x > maxPosX) {
            ball.x = maxPosX;
            ball.velX = -Math.abs(ball.velX);
        }

        if (ball.y < minPos) {
            ball.y = minPos;
            ball.velY = Math.abs(ball.velY);
        } else if (ball.y > maxPosY) {
            ball.y = maxPosY;
            ball.velY = -Math.abs(ball.velY);
        }

        // Check if the ball should be put to sleep
        if (Math.abs(ball.velX) < 0.1 && Math.abs(ball.velY) < 0.1 && ball.y > height - ball.size - 5) {
            ball.isSleeping = true;
        }
    }

    solveCollisions();
    animationId = requestAnimationFrame(loop);
}

function pauseAnimation() {
    isAnimationRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    // Pause all GSAP animations
    gsap.globalTimeline.pause();
}

function resumeAnimation() {
    if (!isAnimationRunning) {
        isAnimationRunning = true;
        // Resume all GSAP animations
        gsap.globalTimeline.resume();
        loop(); // Restart the animation loop
    }
}

loop();

// Window focus/blur event listeners for pausing/resuming animation
window.addEventListener('blur', function() {
    pauseAnimation();
});

window.addEventListener('focus', function() {
    resumeAnimation();
});

// Handle visibility change API for better cross-browser support
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        pauseAnimation();
    } else {
        resumeAnimation();
    }
});

window.addEventListener('resize',function(){
    width = canvas.width = window.innerWidth;
    height = canvas.height = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
})

// Respond to mobile browser UI showing/hiding (address bar)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function(){
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.visualViewport.height;
    });
}

// Add a keydown event listener to toggle the control panel
document.addEventListener('keydown', function(event) {
    if (event.key === 'c' || event.key === 'C') {
        const controlsPanel = document.getElementById('controls');
        const toggleControlsButton = document.getElementById('toggleControls');
        const isVisible = controlsPanel.style.display !== 'none';
        
        if (isVisible) {
            controlsPanel.style.display = 'none';
            toggleControlsButton.style.background = 'rgba(0, 0, 0, 0.5)';
            toggleControlsButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            toggleControlsButton.title = 'Show Controls';
        } else {
            controlsPanel.style.display = 'block';
            toggleControlsButton.style.background = 'rgba(0, 0, 0, 0.7)';
            toggleControlsButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            toggleControlsButton.title = 'Hide Controls';
        }
    }
});

// Add WASD controls for selected ball
document.addEventListener('keydown', function(event) {
    if (selectedBall) {
        const moveSpeed = 2; // Adjust this value for movement speed
        switch(event.key) {
            case 'w':
            case 'W':
                selectedBall.velY = -moveSpeed;
                break;
            case 'a':
            case 'A':
                selectedBall.velX = -moveSpeed;
                break;
            case 's':
            case 'S':
                selectedBall.velY = moveSpeed;
                break;
            case 'd':
            case 'D':
                selectedBall.velX = moveSpeed;
                break;
        }
    }
});

// Add Arrow key controls for selected ball
document.addEventListener('keydown', function(event) {
    if (selectedBall) {
        const moveSpeed = 2; // Adjust this value for movement speed
        switch(event.key) {
            case 'ArrowUp':
                selectedBall.velY = -moveSpeed;
                break;
            case 'ArrowLeft':
                selectedBall.velX = -moveSpeed;
                break;
            case 'ArrowDown':
                selectedBall.velY = moveSpeed;
                break;
            case 'ArrowRight':
                selectedBall.velX = moveSpeed;
                break;
        }
    }
});

// Add gas/brake controls for selected ball
document.addEventListener('keydown', function(event) {
    if (selectedBall) {
        const acceleration = 0.5;
        switch(event.key) {
            case 'n':
            case 'N':
                selectedBall.velX *= (1 + acceleration);
                selectedBall.velY *= (1 + acceleration);
                break;
            case 'm':
            case 'M':
                selectedBall.velX /= (1 + acceleration);
                selectedBall.velY /= (1 + acceleration);
                break;
        }
    }
});