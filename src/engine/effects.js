// File: src/engine/effects.js
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/effects.js',
  exports: ['Effects', 'ScreenShake', 'Particle', 'FadeEffect', 'TransitionEffect'],
  dependencies: ['MathUtils', 'Renderer']
});

// Visual effects system for animations and transitions
window.Effects = {
  // Active effects list
  activeEffects: [],

  // Update all active effects
  update: function(deltaTime) {
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Update and remove completed effects
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.update(dt);
      return !effect.isComplete();
    });
  },

  // Render all active effects
  render: function(ctx) {
    this.activeEffects.forEach(effect => {
      effect.render(ctx);
    });
  },

  // Add screen shake effect
  addScreenShake: function(intensity = 5, duration = 0.3) {
    this.activeEffects.push(new window.ScreenShake(intensity, duration));
  },

  // Add particle burst
  addParticleBurst: function(x, y, count = 10, color = '#ffffff', speed = 100) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      this.activeEffects.push(new window.Particle(x, y, velocity, color, 1.0));
    }
  },

  // Add fade transition
  addFade: function(type = 'in', duration = 1.0, color = '#000000') {
    this.activeEffects.push(new window.FadeEffect(type, duration, color));
  },

  // Add scene transition
  addTransition: function(type = 'slide', duration = 0.5, direction = 'left') {
    this.activeEffects.push(new window.TransitionEffect(type, duration, direction));
  },

  // Add attack effect
  addAttackEffect: function(x, y, targetX, targetY, color = '#ffff00') {
    this.activeEffects.push(new window.AttackEffect(x, y, targetX, targetY, color));
  },

  // Add heal effect
  addHealEffect: function(x, y) {
    this.activeEffects.push(new window.HealEffect(x, y));
  },

  // Add level up effect
  addLevelUpEffect: function(x, y) {
    this.activeEffects.push(new window.LevelUpEffect(x, y));
  },

  // Clear all effects
  clear: function() {
    this.activeEffects = [];
  },

  // Check if any effects are active
  hasActiveEffects: function() {
    return this.activeEffects.length > 0;
  }
};

// Screen shake effect
window.ScreenShake = class ScreenShake {
  constructor(intensity = 5, duration = 0.3) {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
    this.offset = { x: 0, y: 0 };
  }

  update(dt) {
    this.elapsed += dt;
    
    if (this.elapsed < this.duration) {
      // Random shake offset
      this.offset.x = (Math.random() - 0.5) * this.intensity * (1 - this.elapsed / this.duration);
      this.offset.y = (Math.random() - 0.5) * this.intensity * (1 - this.elapsed / this.duration);
    } else {
      this.offset = { x: 0, y: 0 };
    }
  }

  render(ctx) {
    if (this.elapsed < this.duration) {
      ctx.save();
      ctx.translate(this.offset.x, this.offset.y);
    }
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }

  getOffset() {
    return this.offset;
  }
};

// Particle effect
window.Particle = class Particle {
  constructor(x, y, velocity, color = '#ffffff', size = 3, lifetime = 1.0) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.elapsed = 0;
    this.alpha = 1.0;
  }

  update(dt) {
    this.elapsed += dt;
    
    // Update position
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;
    
    // Apply gravity
    this.velocity.y += 200 * dt;
    
    // Fade out
    this.alpha = Math.max(0, 1 - (this.elapsed / this.lifetime));
    
    // Shrink
    this.size *= 0.98;
  }

  render(ctx) {
    if (this.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      
      // Skip anti-aliasing for better performance on low-end devices
      if (window.Performance && window.Performance.settings.particleQuality === 'low') {
        // Simple rectangle for better performance
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
      } else {
        // Full circle for better quality
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  isComplete() {
    return this.elapsed >= this.lifetime || this.size < 0.5;
  }
};

// Fade effect
window.FadeEffect = class FadeEffect {
  constructor(type = 'in', duration = 1.0, color = '#000000') {
    this.type = type;
    this.duration = duration;
    this.color = color;
    this.elapsed = 0;
    this.alpha = 0;
  }

  update(dt) {
    this.elapsed += dt;
    
    if (this.type === 'in') {
      this.alpha = Math.max(0, 1 - (this.elapsed / this.duration));
    } else {
      this.alpha = Math.min(1, this.elapsed / this.duration);
    }
  }

  render(ctx) {
    if (this.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }

  isComplete() {
    if (this.type === 'in') {
      return this.alpha <= 0;
    } else {
      return this.alpha >= 1;
    }
  }
};

// Scene transition effect
window.TransitionEffect = class TransitionEffect {
  constructor(type = 'slide', duration = 0.5, direction = 'left') {
    this.type = type;
    this.duration = duration;
    this.direction = direction;
    this.elapsed = 0;
    this.progress = 0;
  }

  update(dt) {
    this.elapsed += dt;
    this.progress = Math.min(1, this.elapsed / this.duration);
  }

  render(ctx) {
    ctx.save();
    
    switch (this.type) {
      case 'slide':
        this.renderSlideTransition(ctx);
        break;
      case 'zoom':
        this.renderZoomTransition(ctx);
        break;
      case 'circle':
        this.renderCircleTransition(ctx);
        break;
    }
    
    ctx.restore();
  }

  renderSlideTransition(ctx) {
    const offset = ctx.canvas.width * this.progress;
    
    if (this.direction === 'left') {
      // Slide from right to left
      ctx.fillStyle = '#000000';
      ctx.fillRect(ctx.canvas.width - offset, 0, offset, ctx.canvas.height);
    } else if (this.direction === 'right') {
      // Slide from left to right
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, offset, ctx.canvas.height);
    }
  }

  renderZoomTransition(ctx) {
    const scale = 1 + this.progress * 2;
    const alpha = this.progress * 0.8;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000000';
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.fillRect(-ctx.canvas.width / 2, -ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  renderCircleTransition(ctx) {
    const maxRadius = Math.sqrt(ctx.canvas.width * ctx.canvas.width + ctx.canvas.height * ctx.canvas.height);
    const radius = maxRadius * this.progress;
    
    ctx.save();
    ctx.fillStyle = '#000000';
    
    // Create circular mask
    ctx.beginPath();
    ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isComplete() {
    return this.progress >= 1;
  }
};

// Attack effect
window.AttackEffect = class AttackEffect {
  constructor(x, y, targetX, targetY, color = '#ffff00') {
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.color = color;
    this.duration = 0.3;
    this.elapsed = 0;
    this.particles = [];
  }

  update(dt) {
    this.elapsed += dt;
    
    if (this.elapsed < this.duration) {
      // Create particles along the attack path
      if (Math.random() < 0.3) {
        const progress = this.elapsed / this.duration;
        const x = this.startX + (this.targetX - this.startX) * progress;
        const y = this.startY + (this.targetY - this.startY) * progress;
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 50;
        const velocity = {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        };
        
        this.particles.push(new window.Particle(x, y, velocity, this.color, 2, 0.5));
      }
    }
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return !particle.isComplete();
    });
  }

  render(ctx) {
    // Draw attack line
    if (this.elapsed < this.duration) {
      const progress = this.elapsed / this.duration;
      const x = this.startX + (this.targetX - this.startX) * progress;
      const y = this.startY + (this.targetY - this.startY) * progress;
      
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - progress;
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw particles
    this.particles.forEach(particle => particle.render(ctx));
  }

  isComplete() {
    return this.elapsed >= this.duration && this.particles.length === 0;
  }
};

// Heal effect
window.HealEffect = class HealEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.duration = 1.0;
    this.elapsed = 0;
    this.particles = [];
    this.crossSize = 20;
  }

  update(dt) {
    this.elapsed += dt;
    
    if (this.elapsed < this.duration * 0.7) {
      // Create floating particles
      if (Math.random() < 0.2) {
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 40;
        const velocity = {
          x: (Math.random() - 0.5) * 30,
          y: -Math.random() * 50 - 20
        };
        
        this.particles.push(new window.Particle(
          this.x + offsetX, 
          this.y + offsetY, 
          velocity, 
          '#00ff00', 
          3, 
          0.8
        ));
      }
    }
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return !particle.isComplete();
    });
  }

  render(ctx) {
    const progress = this.elapsed / this.duration;
    
    if (progress < 0.7) {
      // Draw glowing cross
      ctx.save();
      ctx.globalAlpha = 1 - (progress / 0.7);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ff00';
      
      ctx.beginPath();
      ctx.moveTo(this.x - this.crossSize, this.y);
      ctx.lineTo(this.x + this.crossSize, this.y);
      ctx.moveTo(this.x, this.y - this.crossSize);
      ctx.lineTo(this.x, this.y + this.crossSize);
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw particles
    this.particles.forEach(particle => particle.render(ctx));
  }

  isComplete() {
    return this.elapsed >= this.duration && this.particles.length === 0;
  }
};

// Level up effect
window.LevelUpEffect = class LevelUpEffect {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.duration = 2.0;
    this.elapsed = 0;
    this.rings = [];
    this.textAlpha = 0;
  }

  update(dt) {
    this.elapsed += dt;
    const progress = this.elapsed / this.duration;
    
    // Create expanding rings
    if (progress < 0.6 && Math.random() < 0.1) {
      this.rings.push({
        radius: 0,
        maxRadius: 100,
        alpha: 1.0
      });
    }
    
    // Update rings
    this.rings = this.rings.filter(ring => {
      ring.radius += 150 * dt;
      ring.alpha = Math.max(0, 1 - (ring.radius / ring.maxRadius));
      return ring.alpha > 0;
    });
    
    // Update text alpha
    if (progress < 0.3) {
      this.textAlpha = progress / 0.3;
    } else if (progress > 0.7) {
      this.textAlpha = Math.max(0, 1 - ((progress - 0.7) / 0.3));
    } else {
      this.textAlpha = 1.0;
    }
  }

  render(ctx) {
    // Draw expanding rings
    this.rings.forEach(ring => {
      ctx.save();
      ctx.globalAlpha = ring.alpha;
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffff00';
      ctx.beginPath();
      ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    
    // Draw level up text
    if (this.textAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this.textAlpha;
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffff00';
      ctx.fillText('LEVEL UP!', this.x, this.y - 60);
      ctx.restore();
    }
  }

  isComplete() {
    return this.elapsed >= this.duration;
  }
};