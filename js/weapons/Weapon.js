import { WEAPONS, WEAPON_LAYERS, customSquadDesign } from '../config.js';

export class Weapon {
    constructor(baseWeaponKey = 'DEFAULT') {
        const base = WEAPONS[baseWeaponKey] || WEAPONS.DEFAULT;
        this.name = base.name;
        this.type = base.type; 
        this.color = base.color;
        this.baseVisualIdx = base.visualIdx;
        
        // Komponenty uzbrojenia definiowane przez warianty taktyczne
        this.barrel = 'standard';   // standard, long (+zasięg), short (+szybkostrzelność), heavy (+moc)
        this.magazine = 'standard'; // standard, drum (+pojemność), quick
        this.sight = 'iron';        // iron, holo (-rozrzut), scope (+zasięg)
        this.attachment = 'none';   // none, grip (stabilizacja)
        this.holster = 'standard';
        
        this.updateModifiers();
    }

    updateModifiers() {
        this.damageMult = 1.0;
        this.fireRateMult = 1.0;
        this.rangeMult = 1.0;
        this.spreadMult = 1.0;

        // Modyfikatory Lufy (Barrel)
        if (this.barrel === 'long') { this.rangeMult += 0.3; this.damageMult += 0.1; }
        if (this.barrel === 'short') { this.fireRateMult -= 0.2; this.rangeMult -= 0.15; }
        if (this.barrel === 'heavy') { this.damageMult += 0.4; this.fireRateMult += 0.25; }

        // Modyfikatory Celownika (Sight)
        if (this.sight === 'holo') { this.spreadMult -= 0.3; }
        if (this.sight === 'scope') { this.rangeMult += 0.5; this.spreadMult -= 0.6; }

        // Modyfikatory Dodatków (Attachment)
        if (this.attachment === 'grip') { this.spreadMult -= 0.25; }
    }

    get visualIdx() {
        if (customSquadDesign && customSquadDesign.customWeaponIdx !== undefined) {
            return customSquadDesign.customWeaponIdx;
        }
        return this.baseVisualIdx;
    }
}
