export class Bush {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 35;
        this.leafClusters = [];
        
        // Generowanie bujnych, gęstych zarośli dżungli w Pixel Arcie
        let clusterCount = 18 + Math.floor(Math.random() * 8);
        for (let i = 0; i < clusterCount; i++) {
            let ang = Math.random() * Math.PI * 2;
            let dist = Math.pow(Math.random(), 0.6) * 28;
            this.leafClusters.push({
                xOffset: Math.cos(ang) * dist,
                yOffset: Math.sin(ang) * dist * 0.75,
                size: 6 + Math.floor(Math.random() * 8),
                color: ['#1e5128', '#3a7d44', '#19381f', '#2d6a4f'][Math.floor(Math.random() * 4)],
                bobSpeed: 1.5 + Math.random() * 1.5,
                bobPhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(dt) {
        // Zarośla delikatnie falują na wietrze dżungli
        let now = Date.now() / 1000;
        for (let cluster of this.leafClusters) {
            cluster.currentBob = Math.sin(now * cluster.bobSpeed + cluster.bobPhase) * 1.5;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.imageSmoothingEnabled = false;

        // Mały pikselowy cień pod zaroślami
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-28, 4, 56, 12);
        
        // Rysowanie klastrów liści (sortowane od tyłu do przodu po Y)
        this.leafClusters.sort((a, b) => a.yOffset - b.yOffset);
        for (let cluster of this.leafClusters) {
            ctx.fillStyle = cluster.color;
            let px = Math.floor((cluster.xOffset - cluster.size/2) / 2) * 2;
            let py = Math.floor((cluster.yOffset + (cluster.currentBob || 0) - cluster.size/2) / 2) * 2;
            ctx.fillRect(px, py, cluster.size, cluster.size);
            
            // Oświetlenie liści w stylu Pixel Art
            if (cluster.size > 8) {
                ctx.fillStyle = '#52b788';
                ctx.fillRect(px + 2, py + 2, 2, 2);
            }
        }

        ctx.restore();
    }
}
