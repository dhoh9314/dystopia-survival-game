// --- materials ---------------------------------------------------------
const MATERIALS = {
  scrap_metal: { id: 'scrap_metal', name: '고철 조각', type: 'material', stack: 99 },
  circuit_board: { id: 'circuit_board', name: '회로 기판', type: 'material', stack: 99 },
  power_cell: { id: 'power_cell', name: '전력 셀', type: 'material', stack: 99 },
  insulated_wire: { id: 'insulated_wire', name: '절연 전선', type: 'material', stack: 99 },
  optic_lens: { id: 'optic_lens', name: '광학 렌즈', type: 'material', stack: 99 },
  alloy_plate: { id: 'alloy_plate', name: '합금 플레이트', type: 'material', stack: 99 },
  cooling_coil: { id: 'cooling_coil', name: '냉각 코일', type: 'material', stack: 99 },
  waterproof_fiber: { id: 'waterproof_fiber', name: '방수 섬유', type: 'material', stack: 99 },
  waste_oil_can: { id: 'waste_oil_can', name: '폐유 캔', type: 'material', stack: 99 },
  compressed_gas_can: { id: 'compressed_gas_can', name: '압축 가스 캔', type: 'material', stack: 99 },
  refined_uranium: { id: 'refined_uranium', name: '정제 우라늄 조각', type: 'material', stack: 20 },
  sentinel_core: { id: 'sentinel_core', name: '센티넬 코어 조각', type: 'material', stack: 20 },
  data_core: { id: 'data_core', name: '데이터 코어', type: 'material', stack: 20 },
}

// --- weapons (damageBonus adds flat damage before variance) ------------
const WEAPONS = {
  rusty_pipe: { id: 'rusty_pipe', name: '녹슨 파이프', type: 'weapon', stack: 1, damageBonus: 3, description: '휘두르면 삐걱거리지만 그럭저럭 쓸만하다.' },
  modified_wrench: { id: 'modified_wrench', name: '개조 스패너', type: 'weapon', stack: 1, damageBonus: 4, description: '손잡이에 천을 감아 쥐기 편하게 만들었다.' },
  spike_knuckles: { id: 'spike_knuckles', name: '스파이크 너클', type: 'weapon', stack: 1, damageBonus: 5, description: '고철 조각을 갈아 만든 즉석 너클.' },
  stun_baton: { id: 'stun_baton', name: '전기 충격봉', type: 'weapon', stack: 1, damageBonus: 5, description: '보안 로봇에게서 노획한 충격봉. 아직 충전이 남아있다.' },
  welding_torch_gun: { id: 'welding_torch_gun', name: '용접 토치건', type: 'weapon', stack: 1, damageBonus: 7, description: '본래 용도와 다르게 쓰이고 있다.' },
  serrated_glove: { id: 'serrated_glove', name: '톱날 글러브', type: 'weapon', stack: 1, damageBonus: 6, description: '손등에 톱날 조각을 용접해 붙인 장갑.' },
  pneumatic_gun: { id: 'pneumatic_gun', name: '압축 공기총', type: 'weapon', stack: 1, damageBonus: 8, description: '압축 가스로 고철 탄환을 발사한다.' },
  salvage_drill: { id: 'salvage_drill', name: '개조 드릴', type: 'weapon', stack: 1, damageBonus: 8, description: '채굴용 드릴을 근접 무기로 개조했다.' },
  impact_hammer: { id: 'impact_hammer', name: '충격 해머', type: 'weapon', stack: 1, damageBonus: 9, description: '무겁지만 한 방이 확실하다.' },
  hf_blade: { id: 'hf_blade', name: '고주파 블레이드', type: 'weapon', stack: 1, damageBonus: 10, description: '초당 수천 번 진동하는 날이 장갑판을 가른다.' },
  mag_blade: { id: 'mag_blade', name: '자기장 블레이드', type: 'weapon', stack: 1, damageBonus: 13, description: '칼날 주위로 전자기장이 일렁인다.' },
  plasma_cutter: { id: 'plasma_cutter', name: '플라즈마 커터', type: 'weapon', stack: 1, damageBonus: 14, description: '센티넬 코어의 잔열로 구동되는 절단기.' },
}

// --- armor (defensePercent reduces incoming damage, 0-1) ---------------
const ARMOR = {
  ragged_vest: { id: 'ragged_vest', name: '누더기 조끼', type: 'armor', stack: 1, defensePercent: 0.05, description: '천과 고철 조각을 엮어 만들었다.' },
  camo_cloak: { id: 'camo_cloak', name: '위장 망토', type: 'armor', stack: 1, defensePercent: 0.08, description: '먼지 색으로 바랜 낡은 망토.' },
  old_gas_mask: { id: 'old_gas_mask', name: '낡은 방독면', type: 'armor', stack: 1, defensePercent: 0.06, description: '필터는 거의 다 됐지만 그래도 없는 것보단 낫다.' },
  reinforced_jacket: { id: 'reinforced_jacket', name: '보강 재킷', type: 'armor', stack: 1, defensePercent: 0.08, description: '안감에 고철 조각을 덧대 보강했다.' },
  scrap_plate_armor: { id: 'scrap_plate_armor', name: '고철 판금 갑옷', type: 'armor', stack: 1, defensePercent: 0.12, description: '투박하지만 확실히 막아준다.' },
  insulated_suit: { id: 'insulated_suit', name: '절연 코팅 슈트', type: 'armor', stack: 1, defensePercent: 0.14, description: '전기 충격과 부식성 물질을 어느 정도 막아준다.' },
  tactical_vest: { id: 'tactical_vest', name: '전술 베스트', type: 'armor', stack: 1, defensePercent: 0.15, description: '기업 보안팀이 쓰던 정식 장비.' },
  riot_shield_vest: { id: 'riot_shield_vest', name: '폭동 진압 조끼', type: 'armor', stack: 1, defensePercent: 0.18, description: '한때 시위 진압용으로 쓰이던 중장비.' },
  heavy_plate_armor: { id: 'heavy_plate_armor', name: '중장갑 플레이트', type: 'armor', stack: 1, defensePercent: 0.22, description: '움직임은 둔해지지만 압도적인 방어력.' },
  sentinel_plating: { id: 'sentinel_plating', name: '센티넬 장갑판', type: 'armor', stack: 1, defensePercent: 0.28, description: '센티넬 유닛의 장갑을 그대로 떼어내 두른다.' },
}

// --- consumables ---------------------------------------------------------
const CONSUMABLES = {
  medkit: { id: 'medkit', name: '응급 처치 키트', type: 'consumable', stack: 10, effect: { hp: 40 } },
  ration_pack: { id: 'ration_pack', name: '전투 식량', type: 'consumable', stack: 10, effect: { hunger: 35 } },
  water_canteen: { id: 'water_canteen', name: '정수 물통', type: 'consumable', stack: 10, effect: { thirst: 40 } },
  stim_pack: { id: 'stim_pack', name: '자극제', type: 'consumable', stack: 10, effect: { fatigue: -30, strength: 2, durationSec: 20 } },
  painkillers: { id: 'painkillers', name: '진통제', type: 'consumable', stack: 10, effect: { hp: 20 } },
  adhesive_patch: { id: 'adhesive_patch', name: '접착 패치', type: 'consumable', stack: 10, effect: { hp: 25 } },
  antibiotics: { id: 'antibiotics', name: '항생제', type: 'consumable', stack: 10, effect: { hp: 15, hunger: 5 } },
  energy_bar: { id: 'energy_bar', name: '에너지바', type: 'consumable', stack: 10, effect: { hunger: 20 } },
  oxygen_canister: { id: 'oxygen_canister', name: '산소 캔', type: 'consumable', stack: 10, effect: { fatigue: -20 } },
  caffeine_pills: { id: 'caffeine_pills', name: '카페인정', type: 'consumable', stack: 10, effect: { fatigue: -15, agility: 1, durationSec: 30 } },
  flare: { id: 'flare', name: '비상 조명탄', type: 'consumable', stack: 10, effect: { perception: 2, durationSec: 30 } },
  sedative: { id: 'sedative', name: '진정제', type: 'consumable', stack: 10, effect: { fatigue: -50 } },
  anti_rad_pills: { id: 'anti_rad_pills', name: '항방사능제', type: 'consumable', stack: 10, effect: { hp: 10, fatigue: -10 } },
  scavenger_stew: { id: 'scavenger_stew', name: '생존자 스튜', type: 'consumable', stack: 10, effect: { hunger: 40, thirst: 10 } },
  adrenaline_shot: { id: 'adrenaline_shot', name: '아드레날린 주사', type: 'consumable', stack: 10, effect: { strength: 6, durationSec: 25 } },
  nanite_gel: { id: 'nanite_gel', name: '나나이트 겔', type: 'consumable', stack: 10, effect: { hp: 50 } },

  reinforced_medkit: { id: 'reinforced_medkit', name: '강화 응급 키트', type: 'consumable', stack: 10, effect: { hp: 70 } },
  field_rations: { id: 'field_rations', name: '야전 비상식량', type: 'consumable', stack: 10, effect: { hunger: 60, hp: 10 } },
  combat_stim: { id: 'combat_stim', name: '전투용 각성제', type: 'consumable', stack: 10, effect: { fatigue: -40, strength: 4, durationSec: 40 } },
  purified_water: { id: 'purified_water', name: '정제수', type: 'consumable', stack: 10, effect: { thirst: 70, fatigue: -10 } },
}

export const ITEMS = { ...MATERIALS, ...WEAPONS, ...ARMOR, ...CONSUMABLES }

export function getItem(id) {
  return ITEMS[id] ?? null
}
