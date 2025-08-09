class InfiniteCosmosTravel {
    constructor() {
        this.canvas = document.getElementById('cosmosCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.startBtn = document.getElementById('startBtn');
        
        // Game state
        this.gameStarted = false;
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.player = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, maxSpeed: 10 };
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // Cosmos objects
        this.stars = [];
        this.planets = [];
        this.nebulae = [];
        this.blackHoles = [];
        this.cosmicObjects = [];
        
        // Stats
        this.stats = {
            objectsDiscovered: 0,
            distanceTraveled: 0,
            currentSpeed: 0
        };
        
        // Generation parameters
        this.chunkSize = 2000;
        this.loadedChunks = new Set();
        this.nearbyObject = null;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.showLoadingScreen();
        
        // Initialize with some objects
        this.generateInitialCosmos();
        
        setTimeout(() => {
            this.startBtn.classList.remove('hidden');
        }, 2000);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * zoomFactor));
        });
        
        // Start button
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        // Explore button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            this.exploreObject();
        });
    }
    
    showLoadingScreen() {
        this.loadingScreen.classList.remove('hidden');
    }
    
    startGame() {
        this.gameStarted = true;
        this.loadingScreen.classList.add('hidden');
        this.gameLoop();
    }
    
    generateInitialCosmos() {
        // Generate stars in a large area around spawn
        for (let i = 0; i < 1000; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * 10000,
                y: (Math.random() - 0.5) * 10000,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2,
                color: this.getRandomStarColor(),
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // Generate planets
        for (let i = 0; i < 50; i++) {
            const planet = {
                x: (Math.random() - 0.5) * 8000,
                y: (Math.random() - 0.5) * 8000,
                size: Math.random() * 80 + 20,
                color: this.getRandomPlanetColor(),
                type: this.getRandomPlanetType(),
                discovered: false,
                rings: Math.random() < 0.3,
                moons: Math.floor(Math.random() * 4)
            };
            this.planets.push(planet);
        }
        
        // Generate nebulae
        for (let i = 0; i < 20; i++) {
            this.nebulae.push({
                x: (Math.random() - 0.5) * 12000,
                y: (Math.random() - 0.5) * 12000,
                size: Math.random() * 400 + 200,
                color: this.getRandomNebulaColor(),
                opacity: Math.random() * 0.3 + 0.1,
                swirl: Math.random() * Math.PI * 2
            });
        }
        
        // Generate black holes
        for (let i = 0; i < 5; i++) {
            this.blackHoles.push({
                x: (Math.random() - 0.5) * 15000,
                y: (Math.random() - 0.5) * 15000,
                size: Math.random() * 60 + 40,
                accretionDisk: true,
                discovered: false
            });
        }
    }
    
    getRandomStarColor() {
        const colors = ['#ffffff', '#ffffcc', '#ffcc99', '#ff9999', '#99ccff', '#ccccff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getRandomPlanetColor() {
        const colors = ['#8B4513', '#228B22', '#4169E1', '#DC143C', '#FFD700', '#9370DB', '#FF6347'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getRandomPlanetType() {
        const types = ['Rocky', 'Gas Giant', 'Ice World', 'Desert', 'Ocean', 'Volcanic', 'Crystal'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getRandomNebulaColor() {
        const colors = ['#FF1493', '#00CED1', '#9370DB', '#FF6347', '#32CD32', '#FFD700'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.handleInput();
        this.updatePlayer();
        this.updateCamera();
        this.generateNearbyObjects();
        this.checkNearbyObjects();
        this.updateStats();
    }
    
    handleInput() {
        const acceleration = 0.5;
        const friction = 0.95;
        
        // Movement
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.vy -= acceleration;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.vy += acceleration;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.vx -= acceleration;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.vx += acceleration;
        }
        
        // Boost
        if (this.keys['Space']) {
            const boostMultiplier = 2;
            this.player.maxSpeed = 20;
        } else {
            this.player.maxSpeed = 10;
        }
        
        // Apply friction
        this.player.vx *= friction;
        this.player.vy *= friction;
        
        // Limit speed
        const currentSpeed = Math.sqrt(this.player.vx ** 2 + this.player.vy ** 2);
        if (currentSpeed > this.player.maxSpeed) {
            this.player.vx = (this.player.vx / currentSpeed) * this.player.maxSpeed;
            this.player.vy = (this.player.vy / currentSpeed) * this.player.maxSpeed;
        }
        
        this.player.speed = currentSpeed;
    }
    
    updatePlayer() {
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        this.stats.distanceTraveled += this.player.speed * 0.01;
        this.stats.currentSpeed = this.player.speed;
    }
    
    updateCamera() {
        // Smooth camera follow
        const targetX = this.player.x;
        const targetY = this.player.y;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }
    
    generateNearbyObjects() {
        const chunkX = Math.floor(this.player.x / this.chunkSize);
        const chunkY = Math.floor(this.player.y / this.chunkSize);
        
        // Check surrounding chunks
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const chunkKey = `${chunkX + dx},${chunkY + dy}`;
                if (!this.loadedChunks.has(chunkKey)) {
                    this.generateChunk(chunkX + dx, chunkY + dy);
                    this.loadedChunks.add(chunkKey);
                }
            }
        }
    }
    
    generateChunk(chunkX, chunkY) {
        const baseX = chunkX * this.chunkSize;
        const baseY = chunkY * this.chunkSize;
        
        // Use chunk coordinates as seed for consistent generation
        const seed = chunkX * 1000 + chunkY;
        Math.seedrandom = seed;
        
        // Generate stars for this chunk
        const starCount = 50 + Math.floor(Math.random() * 50);
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: baseX + Math.random() * this.chunkSize,
                y: baseY + Math.random() * this.chunkSize,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2,
                color: this.getRandomStarColor(),
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // Generate planets for this chunk
        if (Math.random() < 0.3) {
            const planet = {
                x: baseX + Math.random() * this.chunkSize,
                y: baseY + Math.random() * this.chunkSize,
                size: Math.random() * 80 + 20,
                color: this.getRandomPlanetColor(),
                type: this.getRandomPlanetType(),
                discovered: false,
                rings: Math.random() < 0.3,
                moons: Math.floor(Math.random() * 4)
            };
            this.planets.push(planet);
        }
        
        // Generate nebulae for this chunk
        if (Math.random() < 0.1) {
            this.nebulae.push({
                x: baseX + Math.random() * this.chunkSize,
                y: baseY + Math.random() * this.chunkSize,
                size: Math.random() * 400 + 200,
                color: this.getRandomNebulaColor(),
                opacity: Math.random() * 0.3 + 0.1,
                swirl: Math.random() * Math.PI * 2
            });
        }
        
        // Generate black holes for this chunk
        if (Math.random() < 0.02) {
            this.blackHoles.push({
                x: baseX + Math.random() * this.chunkSize,
                y: baseY + Math.random() * this.chunkSize,
                size: Math.random() * 60 + 40,
                accretionDisk: true,
                discovered: false
            });
        }
    }
    
    checkNearbyObjects() {
        this.nearbyObject = null;
        const detectionRange = 150;
        
        // Check planets
        for (const planet of this.planets) {
            const distance = Math.sqrt((planet.x - this.player.x) ** 2 + (planet.y - this.player.y) ** 2);
            if (distance < detectionRange) {
                this.nearbyObject = {
                    type: 'planet',
                    object: planet,
                    distance: distance
                };
                if (!planet.discovered) {
                    planet.discovered = true;
                    this.stats.objectsDiscovered++;
                }
                break;
            }
        }
        
        // Check black holes
        for (const blackHole of this.blackHoles) {
            const distance = Math.sqrt((blackHole.x - this.player.x) ** 2 + (blackHole.y - this.player.y) ** 2);
            if (distance < detectionRange) {
                this.nearbyObject = {
                    type: 'blackhole',
                    object: blackHole,
                    distance: distance
                };
                if (!blackHole.discovered) {
                    blackHole.discovered = true;
                    this.stats.objectsDiscovered++;
                }
                break;
            }
        }
        
        this.updateObjectInfo();
    }
    
    updateObjectInfo() {
        const objectInfo = document.getElementById('objectInfo');
        const objectName = document.getElementById('objectName');
        const objectDescription = document.getElementById('objectDescription');
        
        if (this.nearbyObject) {
            objectInfo.classList.remove('hidden');
            
            if (this.nearbyObject.type === 'planet') {
                const planet = this.nearbyObject.object;
                objectName.textContent = `${planet.type} Planet`;
                objectDescription.textContent = `A ${planet.type.toLowerCase()} world with ${planet.moons} moon(s). ${planet.rings ? 'Beautiful rings orbit this celestial body.' : 'No ring system detected.'}`;
            } else if (this.nearbyObject.type === 'blackhole') {
                objectName.textContent = 'Black Hole';
                objectDescription.textContent = 'A massive gravitational anomaly warping spacetime itself. Approach with extreme caution.';
            }
        } else {
            objectInfo.classList.add('hidden');
        }
    }
    
    exploreObject() {
        if (this.nearbyObject) {
            // Simple exploration effect - could be expanded
            alert(`You explored the ${this.nearbyObject.type}! Discovery logged.`);
        }
    }
    
    updateStats() {
        document.getElementById('speedDisplay').textContent = this.stats.currentSpeed.toFixed(1);
        document.getElementById('objectCount').textContent = this.stats.objectsDiscovered;
        document.getElementById('distanceDisplay').textContent = this.stats.distanceTraveled.toFixed(1);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render nebulae (background)
        this.renderNebulae();
        
        // Render stars
        this.renderStars();
        
        // Render planets
        this.renderPlanets();
        
        // Render black holes
        this.renderBlackHoles();
        
        // Render player
        this.renderPlayer();
        
        this.ctx.restore();
        
        // Render UI elements
        this.renderUI();
    }
    
    renderStars() {
        const viewDistance = 3000 / this.camera.zoom;
        
        for (const star of this.stars) {
            const distance = Math.sqrt((star.x - this.camera.x) ** 2 + (star.y - this.camera.y) ** 2);
            if (distance > viewDistance) continue;
            
            this.ctx.save();
            this.ctx.globalAlpha = star.brightness * (1 - Math.sin(Date.now() * 0.001 + star.twinkle) * 0.2);
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderNebulae() {
        const viewDistance = 4000 / this.camera.zoom;
        
        for (const nebula of this.nebulae) {
            const distance = Math.sqrt((nebula.x - this.camera.x) ** 2 + (nebula.y - this.camera.y) ** 2);
            if (distance > viewDistance) continue;
            
            this.ctx.save();
            this.ctx.globalAlpha = nebula.opacity;
            
            const gradient = this.ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.size
            );
            gradient.addColorStop(0, nebula.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(nebula.x, nebula.y, nebula.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    renderPlanets() {
        const viewDistance = 2000 / this.camera.zoom;
        
        for (const planet of this.planets) {
            const distance = Math.sqrt((planet.x - this.camera.x) ** 2 + (planet.y - this.camera.y) ** 2);
            if (distance > viewDistance) continue;
            
            // Planet body
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Rings
            if (planet.rings) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(planet.x, planet.y, planet.size * 1.5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Discovery indicator
            if (planet.discovered) {
                this.ctx.strokeStyle = '#00ffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(planet.x, planet.y, planet.size + 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    renderBlackHoles() {
        const viewDistance = 2000 / this.camera.zoom;
        
        for (const blackHole of this.blackHoles) {
            const distance = Math.sqrt((blackHole.x - this.camera.x) ** 2 + (blackHole.y - this.camera.y) ** 2);
            if (distance > viewDistance) continue;
            
            // Accretion disk
            if (blackHole.accretionDisk) {
                const gradient = this.ctx.createRadialGradient(
                    blackHole.x, blackHole.y, blackHole.size,
                    blackHole.x, blackHole.y, blackHole.size * 2
                );
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(blackHole.x, blackHole.y, blackHole.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Black hole itself
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(blackHole.x, blackHole.y, blackHole.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Event horizon
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(blackHole.x, blackHole.y, blackHole.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Discovery indicator
            if (blackHole.discovered) {
                this.ctx.strokeStyle = '#ff00ff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(blackHole.x, blackHole.y, blackHole.size + 15, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    renderPlayer() {
        // Player ship
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // Ship body
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(-6, 8);
        this.ctx.lineTo(0, 4);
        this.ctx.lineTo(6, 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Engine trail when moving
        if (this.player.speed > 1) {
            this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.min(this.player.speed / 10, 1)})`;
            this.ctx.beginPath();
            this.ctx.moveTo(-3, 8);
            this.ctx.lineTo(0, 8 + this.player.speed * 2);
            this.ctx.lineTo(3, 8);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    renderUI() {
        // Minimap could go here
        // Additional UI elements
    }
    
    gameLoop() {
        if (!this.gameStarted) return;
        
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new InfiniteCosmosTravel();
});
