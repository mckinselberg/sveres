# Bouncing Spheres - Interactive Ball Physics Simulation

An interactive, real-time physics simulation featuring bouncing balls with realistic deformation effects, collision detection, and comprehensive visual feedback systems.

![Bouncing Spheres Animation](https://img.shields.io/badge/Physics-Simulation-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow) ![Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)

## Features

### 🏀 Core Physics Simulation

- **Real-time collision detection** with advanced ball-to-ball and wall collision handling
- **Elastic collision physics** with proper momentum conservation
- **Realistic deformation effects** during impacts using GSAP animations
- **Collision cooldown system** preventing ball sticking and collision loops
- **Grazing collision detection** for natural, sliding collisions

### 🎨 Visual Effects

- **Dynamic ripple effects** that propagate from collision points
- **Directional ripples** based on collision angles and impact force
- **Color-changing feedback** during collisions with smooth transitions
- **Deformation animations** with multiple easing options (elastic, bounce, smooth, etc.)
- **Multiple geometric shapes** with rotating polygonal objects and animated stars
- **Motion trails** with adjustable opacity
- **Customizable background colors**

### 🎛️ Interactive Controls

#### Ball Management

- **Dynamic ball count** (0-100 balls) with real-time addition/removal
- **Variable ball sizes** (10-150px) with live resizing
- **Multiple shape options** (Circle, Square, Triangle, Diamond, Pentagon, Hexagon, Star, Mixed)
- **Adjustable velocity** (1-15 speed units) affecting all balls
- **Individual ball editing** for selected balls (color, size, velocity, shape)
- **Reset functionality** to restore default settings

#### Physics Parameters

- **Deformation intensity** and speed controls
- **Animation speed multiplier** (0.5x - 3.0x)
- **Gravity toggle** with adjustable strength
- **Custom easing functions** with override capability
- **Trail opacity** for motion visualization

#### User Interface

- **Toggleable control panels** with gear button
- **Color scheme management** (save/load/delete custom themes)
- **UI opacity controls** for better visibility
- **Professional dark theme** with semi-transparent panels
- **Responsive design** with fixed positioning

## Technical Architecture

### 🏗️ Core Technologies

- **HTML5 Canvas** for high-performance 2D rendering
- **JavaScript ES6+** with modern module syntax
- **GSAP 3.11.5** for smooth animations and deformation effects
- **Vite** as the build system for fast development and bundling
- **CSS3** for responsive UI design

### 📁 Project Structure

```
balls/
├── src/
│   ├── index.js          # Main entry point
│   ├── js/
│   │   ├── balls.js      # Core physics simulation
│   │   ├── shape.js      # Base shape classes
│   │   └── square.js     # Alternative shape implementations
│   ├── css/
│   │   └── App.scss      # Stylesheets
│   └── img/
│       └── lola.png      # Assets
├── index.html            # Main HTML file with controls
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

### 🧮 Physics Implementation

#### Collision Detection

- **Spatial partitioning** for efficient collision checks
- **Distance-based detection** with combined radius calculations
- **Approach speed validation** to prevent false collision processing
- **Collision cooldown system** (50ms) preventing rapid re-collisions

#### Collision Response

- **Standard elastic collision** formulas with mass consideration
- **Normal and tangential velocity** component separation
- **Energy conservation** with configurable elasticity (0.9 default)
- **Friction simulation** through tangential velocity dampening
- **Aggressive separation** with buffer zones to prevent overlap

#### Ball Physics

```javascript
class Ball {
  constructor(x, y, velX, velY, color, size, shape = 'circle')
  // Properties:
  // - Position (x, y)
  // - Velocity (velX, velY)
  // - Shape (circle, square, triangle, diamond, pentagon, hexagon, star)
  // - Rotation (rotation, rotationSpeed) for polygonal shapes
  // - Deformation (scaleX, scaleY, deformAngle)
  // - Visual effects (ripples, color transitions)
  // - Animation state (isAnimating, lastAnimationTime)
  // - Collision prevention (lastCollisionTime)
}
```

#### Wall Collision System

- **Boundary detection** with effective radius calculations
- **Grazing vs. direct collision** classification
- **Speed-based deformation** intensity
- **Directional ripple effects** based on wall normals
- **Velocity dampening** for realistic energy loss

### 🎯 Key Algorithms

#### Collision Detection Loop

```javascript
function detectCollisions() {
  // Nested loop O(n²) with optimizations:
  // - Collision cooldown filtering
  // - Distance pre-screening
  // - Approach speed validation
  // - Immediate collision resolution
}
```

#### Deformation System

```javascript
function applyDeformation(ball, intensity, angle) {
  // GSAP timeline animation:
  // 1. Initial compression against impact surface
  // 2. Perpendicular stretching
  // 3. Elastic restoration with overshoot
  // 4. Smooth return to original shape
}
```

### 🎮 User Interaction

#### Control System

- **Real-time parameter updates** with immediate visual feedback
- **Event-driven architecture** for responsive controls
- **Local storage integration** for persistent color schemes
- **Input validation** and range limiting for stability

#### Ball Selection

- **Click-to-select** individual balls for editing
- **Visual selection indicators** with highlighting
- **Dedicated control panel** for selected ball properties
- **Multi-property editing** (color, size, velocity, speed, shape)

### 🎭 Shape System

#### Available Shapes

- **Circle** - Classic round balls with smooth collisions
- **Square** - Rectangular shapes with corner interactions
- **Triangle** - Three-sided polygons with pointed edges
- **Diamond** - Four-sided rhombus shape rotated 45°
- **Pentagon** - Five-sided regular polygons
- **Hexagon** - Six-sided regular polygons
- **Star** - Five-pointed star with alternating inner/outer radii
- **Mixed Shapes** - Random combination of all shape types

#### Shape Features

- **Automatic rotation** for polygonal shapes with random rotation speeds
- **Collision detection** adapted for all shape types using bounding circles
- **Visual consistency** with ripples and deformation effects for all shapes
- **Individual shape editing** through selected ball controls

## Installation & Setup

### Prerequisites

- Node.js 16+
- npm or yarn package manager

### Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd balls

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

```bash
# Development server with hot reload
npm run dev

# Preview production build
npm run preview
```

## Testing

Run unit tests with:

```bash
npm test
```


## Configuration

### Physics Parameters

- Modify `balls.js` for collision physics constants
- Adjust deformation intensities in control ranges
- Configure GSAP easing functions in deformation system

### Visual Customization

- Update CSS variables in `App.scss` for theming
- Modify ripple parameters in `addRipple()` method
- Customize color schemes in the UI control panel

### Performance Tuning

- Adjust collision detection frequency
- Modify ripple rendering limits
- Configure GSAP animation performance settings

## Browser Compatibility

- **Modern browsers** with HTML5 Canvas support
- **ES6+ compatibility** required
- **Optimal performance** on desktop browsers
- **Mobile support** with touch-friendly controls

## Performance Considerations

- **Collision detection optimization** with cooldown system
- **Animation performance** via GSAP hardware acceleration
- **Memory management** with automatic ripple cleanup
- **Rendering optimization** through Canvas 2D API efficiency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with proper testing
4. Submit a pull request with detailed description

## License

This project is open source. Please check the license file for details.

## Recent Updates

- ✅ **Extended shape system** with 7 different geometric shapes (circles, polygons, stars)
- ✅ **Individual shape editing** for selected balls with real-time updates
- ✅ **Mixed shape mode** creating variety with random shape assignment
- ✅ **Rotating polygons** with physics-accurate collision detection
- ✅ Fixed ball sticking issues with collision cooldown system
- ✅ Implemented proper elastic collision physics
- ✅ Added comprehensive deformation effects
- ✅ Enhanced UI with professional control panels
- ✅ Optimized performance with improved collision detection

---

_Built with passion for physics simulation and interactive web experiences._
