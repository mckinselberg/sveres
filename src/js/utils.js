
export function random(min, max) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}

export function resizeAllBalls(balls, width, height, newSize) {
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

export function adjustBallCount(balls, addNewBall, updateBallCountSlider, targetCount) {
    while (balls.length < targetCount) {
        addNewBall();
    }
    while (balls.length > targetCount && balls.length > 1) {
        balls.pop();
    }
    updateBallCountSlider();
}

export function adjustBallVelocities(balls, maxVelocity, random) {
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

export function addNewBall(balls, width, height, random, obstacles, x = null, y = null) {
    const ballSize = parseInt(document.getElementById('ballSize')?.value || 90);
    const ballVelocity = parseInt(document.getElementById('ballVelocity')?.value || 7);
    const size = ballSize;
    
    let attempts = 0;
    let newX = x;
    let newY = y;
    let validPosition = false;

    if (newX === null || newY === null) {
        // Try to find a position that doesn't overlap with existing balls or obstacles
        while (!validPosition && attempts < 50) {
            newX = random(size, width - size);
            newY = random(size, height - size);
            
            validPosition = true;
            for (let ball of balls) {
                const distance = Math.sqrt((newX - ball.x) ** 2 + (newY - ball.y) ** 2);
                if (distance < size + ball.size + 10) { // Add buffer
                    validPosition = false;
                    break;
                }
            }
            if (validPosition) {
                for (let obstacle of obstacles) {
                    const distance = Math.sqrt((newX - obstacle.x) ** 2 + (newY - obstacle.y) ** 2);
                    if (distance < size + obstacle.radius + 10) {
                        validPosition = false;
                        break;
                    }
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
    
    const ball = new Ball(
        newX, newY,
        random(-ballVelocity, ballVelocity),
        random(-ballVelocity, ballVelocity),
        'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')',
        size
    );
    balls.push(ball);
}

export function updateBallCountSlider(balls) {
    const ballCountSlider = document.getElementById('ballCount');
    const ballCountValue = document.getElementById('ballCountValue');
    if (ballCountSlider && ballCountValue) {
        ballCountSlider.value = balls.length;
        ballCountValue.textContent = balls.length;
    }
}

export function resetAllBalls(balls, width, height, random) {
    balls.length = 0; // Clear existing balls
    
    const ballSize = parseInt(document.getElementById('ballSize')?.value || 90);
    const ballCount = parseInt(document.getElementById('ballCount')?.value || 5);
    const ballVelocity = parseInt(document.getElementById('ballVelocity')?.value || 7);
    
    // Create new balls with current settings
    while (balls.length < ballCount) {
        const size = ballSize;
        const ball = new Ball(
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

export function addNewObstacle(obstacles, width, height, random, balls, Obstacle, x = null, y = null) {
    const obstacleSize = parseInt(document.getElementById('obstacleSize')?.value || 50);
    const radius = obstacleSize;

    let attempts = 0;
    let newX = x;
    let newY = y;
    let validPosition = false;

    if (newX === null || newY === null) {
        while (!validPosition && attempts < 50) {
            newX = random(radius, width - radius);
            newY = random(radius, height - radius);

            validPosition = true;
            // Check for overlap with existing balls and obstacles
            for (let ball of balls) {
                const distance = Math.sqrt((newX - ball.x) ** 2 + (newY - ball.y) ** 2);
                if (distance < radius + ball.size + 10) {
                    validPosition = false;
                    break;
                }
            }
            if (validPosition) {
                for (let obstacle of obstacles) {
                    const distance = Math.sqrt((newX - obstacle.x) ** 2 + (newY - obstacle.y) ** 2);
                    if (distance < radius + obstacle.radius + 10) {
                        validPosition = false;
                        break;
                    }
                }
            }
            attempts++;
        }
        if (!validPosition) {
            newX = random(radius, width - radius);
            newY = random(radius, height - radius);
        }
    }

    const obstacle = new Obstacle(
        newX, newY,
        radius,
        'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ')'
    );
    obstacles.push(obstacle);
}

export function adjustObstacleCount(obstacles, addNewObstacle, updateObstacleCountSlider, targetCount) {
    while (obstacles.length < targetCount) {
        addNewObstacle();
    }
    while (obstacles.length > targetCount) {
        obstacles.pop();
    }
    updateObstacleCountSlider();
}

export function updateObstacleCountSlider(obstacles) {
    const obstacleCountSlider = document.getElementById('obstacleCount');
    const obstacleCountValue = document.getElementById('obstacleCountValue');
    if (obstacleCountSlider && obstacleCountValue) {
        obstacleCountSlider.value = obstacles.length;
        obstacleCountValue.textContent = obstacles.length;
    }
}

export function rgbToHex(rgb) {
    const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbMatch) return '#000000'; // Default to black if format is unexpected
    const toHex = (c) => {
        const hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(rgbMatch[1]) + toHex(rgbMatch[2]) + toHex(rgbMatch[3]);
}
