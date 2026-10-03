function recipe(id, name, description, inputs, outputItemId, outputQty = 1) {
  return { id, name, description, inputs, outputItemId, outputQty }
}

const CONSUMABLE_RECIPES = [
  recipe(
    'reinforced_medkit',
    '강화 응급 키트',
    '회로 기판으로 약물 주입 장치를 보강한 응급 키트. 더 많은 체력을 회복한다.',
    [{ itemId: 'medkit', qty: 1 }, { itemId: 'circuit_board', qty: 2 }],
    'reinforced_medkit'
  ),
  recipe(
    'field_rations',
    '야전 비상식량',
    '전투 식량을 고철 화로로 압축 가공해 더 오래 버틴다.',
    [{ itemId: 'ration_pack', qty: 2 }, { itemId: 'scrap_metal', qty: 1 }],
    'field_rations'
  ),
  recipe(
    'combat_stim',
    '전투용 각성제',
    '전력 셀로 자극제를 과충전시켜 더 강력하고 오래가는 효과를 낸다.',
    [{ itemId: 'stim_pack', qty: 1 }, { itemId: 'power_cell', qty: 2 }],
    'combat_stim'
  ),
  recipe(
    'purified_water',
    '정제수',
    '고철 필터로 물통을 거듭 정제해 갈증을 확실하게 해소한다.',
    [{ itemId: 'water_canteen', qty: 2 }, { itemId: 'scrap_metal', qty: 1 }],
    'purified_water'
  ),
  recipe(
    'scavenger_stew',
    '생존자 스튜',
    '전투 식량과 정수를 함께 끓여 허기와 갈증을 동시에 달랜다.',
    [{ itemId: 'ration_pack', qty: 1 }, { itemId: 'water_canteen', qty: 1 }],
    'scavenger_stew'
  ),
  recipe(
    'oxygen_canister',
    '산소 캔',
    '압축 가스 캔을 방수 섬유로 밀봉해 호흡용으로 개조한다.',
    [{ itemId: 'compressed_gas_can', qty: 1 }, { itemId: 'waterproof_fiber', qty: 1 }],
    'oxygen_canister'
  ),
  recipe(
    'sedative',
    '진정제',
    '항생제를 정수와 희석해 강력한 진정 효과를 낸다.',
    [{ itemId: 'antibiotics', qty: 1 }, { itemId: 'water_canteen', qty: 1 }],
    'sedative'
  ),
  recipe(
    'anti_rad_pills',
    '항방사능제',
    '정제 우라늄의 방사선량을 역산해 내성 물질을 추출한다. 역설적이지만 효과는 확실하다.',
    [{ itemId: 'refined_uranium', qty: 1 }, { itemId: 'water_canteen', qty: 1 }],
    'anti_rad_pills'
  ),
  recipe(
    'adrenaline_shot',
    '아드레날린 주사',
    '자극제와 각성제를 섞어 더 강력한 각성 효과를 압축한다.',
    [{ itemId: 'stim_pack', qty: 1 }, { itemId: 'combat_stim', qty: 1 }],
    'adrenaline_shot'
  ),
  recipe(
    'nanite_gel',
    '나나이트 겔',
    '데이터 코어에 남은 제어 신호로 나노머신을 활성화해 상처를 재구성한다.',
    [{ itemId: 'data_core', qty: 1 }, { itemId: 'power_cell', qty: 2 }, { itemId: 'medkit', qty: 1 }],
    'nanite_gel'
  ),
]

const WEAPON_RECIPES = [
  recipe('rusty_pipe', '녹슨 파이프', '고철을 그대로 이어 붙인 투박한 무기.', [{ itemId: 'scrap_metal', qty: 3 }], 'rusty_pipe'),
  recipe('modified_wrench', '개조 스패너', '손잡이에 천을 감아 쥐기 편하게 만든다.', [{ itemId: 'scrap_metal', qty: 2 }, { itemId: 'circuit_board', qty: 1 }], 'modified_wrench'),
  recipe('spike_knuckles', '스파이크 너클', '고철 조각을 갈아 손등에 고정한다.', [{ itemId: 'scrap_metal', qty: 4 }], 'spike_knuckles'),
  recipe('stun_baton', '전기 충격봉', '전력 셀로 충격봉의 방전 회로를 재충전한다.', [{ itemId: 'circuit_board', qty: 2 }, { itemId: 'power_cell', qty: 1 }], 'stun_baton'),
  recipe('serrated_glove', '톱날 글러브', '톱날 조각을 장갑에 용접해 붙인다.', [{ itemId: 'scrap_metal', qty: 3 }, { itemId: 'circuit_board', qty: 1 }], 'serrated_glove'),
  recipe('welding_torch_gun', '용접 토치건', '압축 가스로 화염을 뿜도록 개조한다.', [{ itemId: 'compressed_gas_can', qty: 1 }, { itemId: 'scrap_metal', qty: 2 }], 'welding_torch_gun'),
  recipe('pneumatic_gun', '압축 공기총', '압축 가스와 합금 플레이트로 탄환 발사관을 만든다.', [{ itemId: 'compressed_gas_can', qty: 2 }, { itemId: 'alloy_plate', qty: 1 }], 'pneumatic_gun'),
  recipe('salvage_drill', '개조 드릴', '채굴용 드릴 모터를 전력 셀로 재구동한다.', [{ itemId: 'alloy_plate', qty: 1 }, { itemId: 'power_cell', qty: 2 }], 'salvage_drill'),
  recipe('impact_hammer', '충격 해머', '합금 플레이트를 겹쳐 무게 중심을 잡는다.', [{ itemId: 'alloy_plate', qty: 2 }, { itemId: 'scrap_metal', qty: 2 }], 'impact_hammer'),
  recipe('hf_blade', '고주파 블레이드', '냉각 코일로 칼날의 초고속 진동을 유지한다.', [{ itemId: 'cooling_coil', qty: 1 }, { itemId: 'circuit_board', qty: 3 }, { itemId: 'alloy_plate', qty: 1 }], 'hf_blade'),
  recipe('mag_blade', '자기장 블레이드', '절연 전선을 감아 칼날 주위에 전자기장을 형성한다.', [{ itemId: 'insulated_wire', qty: 3 }, { itemId: 'power_cell', qty: 2 }, { itemId: 'alloy_plate', qty: 1 }], 'mag_blade'),
  recipe('plasma_cutter', '플라즈마 커터', '센티넬 코어의 잔열과 정제 우라늄으로 절단기를 구동한다.', [{ itemId: 'sentinel_core', qty: 1 }, { itemId: 'refined_uranium', qty: 1 }, { itemId: 'cooling_coil', qty: 2 }], 'plasma_cutter'),
]

const ARMOR_RECIPES = [
  recipe('reinforced_jacket', '보강 재킷', '안감에 고철 조각과 방수 섬유를 덧댄다.', [{ itemId: 'scrap_metal', qty: 3 }, { itemId: 'waterproof_fiber', qty: 1 }], 'reinforced_jacket'),
  recipe('scrap_plate_armor', '고철 판금 갑옷', '합금 플레이트를 이어 붙여 투박하지만 튼튼하게 만든다.', [{ itemId: 'alloy_plate', qty: 2 }, { itemId: 'scrap_metal', qty: 2 }], 'scrap_plate_armor'),
  recipe('insulated_suit', '절연 코팅 슈트', '절연 전선과 방수 섬유로 전신을 코팅한다.', [{ itemId: 'insulated_wire', qty: 2 }, { itemId: 'waterproof_fiber', qty: 2 }], 'insulated_suit'),
  recipe('tactical_vest', '전술 베스트', '기업 보안팀 규격을 참고해 합금과 회로를 조합한다.', [{ itemId: 'alloy_plate', qty: 1 }, { itemId: 'insulated_wire', qty: 1 }, { itemId: 'circuit_board', qty: 2 }], 'tactical_vest'),
  recipe('riot_shield_vest', '폭동 진압 조끼', '합금 플레이트를 겹겹이 덧대 충격을 분산시킨다.', [{ itemId: 'alloy_plate', qty: 3 }, { itemId: 'scrap_metal', qty: 2 }], 'riot_shield_vest'),
  recipe('heavy_plate_armor', '중장갑 플레이트', '냉각 코일로 과열 없이 중장갑을 유지한다.', [{ itemId: 'alloy_plate', qty: 4 }, { itemId: 'cooling_coil', qty: 1 }], 'heavy_plate_armor'),
  recipe('sentinel_plating', '센티넬 장갑판', '센티넬 코어의 장갑판을 그대로 떼어내 두른다.', [{ itemId: 'sentinel_core', qty: 2 }, { itemId: 'alloy_plate', qty: 2 }], 'sentinel_plating'),
]

export const RECIPE_LIST = [...CONSUMABLE_RECIPES, ...WEAPON_RECIPES, ...ARMOR_RECIPES]
export const RECIPES = Object.fromEntries(RECIPE_LIST.map((r) => [r.id, r]))

export function getRecipe(id) {
  return RECIPES[id] ?? null
}
