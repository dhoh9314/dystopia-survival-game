// Superpower definitions. Each is a passive stat modifier + one combat-relevant trait.
// mods apply additively to base character stats at computeEffectiveStats() time.

export const SUPERPOWERS = {
  pyrokinesis: {
    id: 'pyrokinesis',
    name: '발화 조작',
    description: '접촉 없이 열을 발생시켜 태운다. 공격 시 일정 확률로 로봇의 회로를 과열시켜 지속 피해를 입힌다.',
    mods: { strength: 2, vitality: -1 },
    trait: { type: 'burn', chance: 0.3, dps: 4, duration: 3 },
  },
  kinetic_barrier: {
    id: 'kinetic_barrier',
    name: '운동 장벽',
    description: '피부 표면에 순간적인 운동 에너지 장벽을 형성해 피해를 흡수한다.',
    mods: { vitality: 3, agility: -1 },
    trait: { type: 'damage_reduction', percent: 0.15 },
  },
  neural_override: {
    id: 'neural_override',
    name: '신경 해킹',
    description: '기계 신경망에 간섭해 로봇의 제어 체계를 교란한다. 로봇 상대로 추가 피해와 짧은 마비를 유발한다.',
    mods: { perception: 3 },
    trait: { type: 'bonus_vs_robot', percent: 0.25, stunChance: 0.15, stunDuration: 1.5 },
  },
  adrenal_surge: {
    id: 'adrenal_surge',
    name: '아드레날린 폭주',
    description: '분비샘을 의지로 통제해 폭발적인 신체 능력을 끌어낸다. 공격할 때 일정 확률로 한 번 더 몰아친다.',
    mods: { agility: 4, perception: -1 },
    trait: { type: 'extra_attack', chance: 0.3 },
  },
  biotic_regeneration: {
    id: 'biotic_regeneration',
    name: '생체 재생',
    description: '세포 재생 속도를 극단적으로 가속시켜 상처를 빠르게 회복한다.',
    mods: { vitality: 2, strength: -1 },
    trait: { type: 'regen', hpPerSec: 1.2 },
  },
  emp_pulse: {
    id: 'emp_pulse',
    name: '전자기 펄스',
    description: '짧은 전자기 파동을 방출해 주변 로봇을 일시 마비시킨다. 다수의 적을 상대할 때 강력하다.',
    mods: { perception: 1, strength: 1 },
    trait: { type: 'aoe_stun', radius: 120, cooldown: 12, duration: 2 },
  },
  blood_forge: {
    id: 'blood_forge',
    name: '혈철 주조',
    description: '스스로의 몸에 상처를 내어 흘러나온 피를 압축, 결정화시켜 날카로운 무기로 벼려낸다. 체력을 대가로 짧은 시간 압도적인 공격력을 얻는다.',
    mods: { strength: 1, vitality: -2 },
    trait: { type: 'blood_weapon', selfDamage: 15, strengthBonus: 9, duration: 8, cooldown: 18 },
  },
  shadow_weaving: {
    id: 'shadow_weaving',
    name: '그림자 조종',
    description: '자신의 그림자를 날카로운 촉수처럼 다뤄 먼 거리의 적을 꿰뚫는다. 사거리 밖에 있는 로봇도 그림자가 닿는 한 타격할 수 있다.',
    mods: { agility: 2, perception: 2, vitality: -2 },
    trait: { type: 'shadow_strike', range: 320, damageMultiplier: 1.8, cooldown: 9 },
  },
}

export const SUPERPOWER_LIST = Object.values(SUPERPOWERS)

export function getSuperpower(id) {
  return SUPERPOWERS[id] ?? null
}
