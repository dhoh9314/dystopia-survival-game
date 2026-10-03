// Random flavor/event pool rolled during "탐색하기" (search), separate from
// the robot-encounter roll. Keeps exploration from being just loot-or-robot.
// Hazards are excluded at isSafe locations; npc/lore events can occur anywhere.
//
// Most events resolve immediately via run(player). 'choice' events instead
// present 2-3 options and resolve(player, choiceId) once the player answers
// (see combat.js:resolveEventChoice and socket.js's 'eventChoice' handler).

import { getItem } from './items.js'
import { addToInventory, itemCount, removeFromInventory } from '../game/inventory.js'

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

const RUMOR_LINES = [
  '벽에 누군가 "통제소는 거짓말을 한다"라고 휘갈겨 썼습니다.',
  '먼 곳에서 정기 순찰 로봇의 경적이 세 번 울리고 멈췄습니다.',
  '바닥에 구겨진 전단지가 있습니다. "배급은 중단되었습니다"라고만 적혀 있습니다.',
  '낡은 스피커에서 지지직거리는 소리와 함께 알아들을 수 없는 숫자들이 흘러나옵니다.',
  '누군가 벽에 날짜를 하루하루 그어온 흔적이 300일을 넘긴 채 멈춰 있습니다.',
  '"첨탑에 가까이 가지 마라"는 문구가 여러 번 겹쳐 쓰여 있습니다.',
  '정전 첫날의 신문 한 장이 벽에 테이프로 붙어 있습니다. 1면 머리기사가 지워져 있습니다.',
  '누군가 바닥에 작은 화살표와 함께 "이쪽은 안전함"이라 써두었습니다. 화살표가 가리키는 곳은 무너져 있습니다.',
  '통제소 로고가 찍힌 포스터 위에 굵은 글씨로 "거짓"이라고 덧써져 있습니다.',
  '벽에 수십 명의 이름이 적혀 있습니다. 마지막 줄은 끝까지 채워지지 못했습니다.',
]

const BROADCAST_LINES = [
  '"...관리 구역 내 모든 자동화 유닛은 최종 지침에 따라 임무를 계속합니다..." 방송이 끊깁니다.',
  '"...생존자 여러분, 지정된 대피소로 이동하십시오..." 같은 문구가 몇 년째 반복되고 있습니다.',
  '잡음 사이로 누군가의 숨소리 같은 것이 섞여 들립니다. 곧 끊깁니다.',
  '"...정전은 일시적입니다..." 라는 안내가 지금도 흘러나옵니다.',
  '"...검은 첨탑 구역 접근을 자제하십시오..." 경고음과 함께 방송이 반복됩니다.',
  '주파수가 잠깐 맞춰지며 낯선 언어의 숫자 암호가 흘러나오다 사라집니다.',
  '"...금일 배급은 전면 중단됩니다..." 라는 말과 함께 방송이 영구히 끊깁니다.',
  '오래된 동요 한 소절이 스피커에서 흘러나옵니다. 누가, 왜 송출하는지는 알 수 없습니다.',
]

export const EVENTS = [
  // ---------------- npc ----------------
  {
    id: 'survivor_gift',
    type: 'npc',
    weight: 2,
    safeOk: true,
    run(player) {
      const itemId = pick(['scrap_metal', 'ration_pack', 'water_canteen'])
      addToInventory(player, itemId, 1)
      return {
        message: `떠돌이 생존자와 마주쳤습니다. 말없이 ${getItem(itemId).name}을(를) 건네고는 어둠 속으로 사라졌습니다.`,
        loot: [{ itemId, qty: 1 }],
      }
    },
  },
  {
    id: 'survivor_flee',
    type: 'npc',
    weight: 2,
    safeOk: true,
    run() {
      return { message: '겁에 질린 생존자가 당신을 보더니 반대 방향으로 황급히 달아났습니다.' }
    },
  },
  {
    id: 'survivor_warning',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '지나가던 생존자가 "그쪽 길은 위험해"라고 짧게 경고하고는 사라졌습니다.' }
    },
  },
  {
    id: 'survivor_singing',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '어디선가 누군가 낮게 흥얼거리는 소리가 들립니다. 모퉁이를 돌아보니 아무도 없습니다.' }
    },
  },
  {
    id: 'survivor_child_trace',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '작은 발자국과 함께 색연필로 그린 그림이 벽에 붙어 있습니다. 누가 그렸는지는 알 수 없습니다.' }
    },
  },
  {
    id: 'survivor_group_glimpse',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '멀리서 여러 명의 실루엣이 빠르게 이동하는 것이 보입니다. 다가가기 전에 사라졌습니다.' }
    },
  },
  {
    id: 'survivor_note',
    type: 'npc',
    weight: 2,
    safeOk: true,
    run(player) {
      addToInventory(player, 'water_canteen', 1)
      return {
        message: '"먼저 간다, 미안"이라 적힌 쪽지와 함께 물통 하나가 남겨져 있습니다.',
        loot: [{ itemId: 'water_canteen', qty: 1 }],
      }
    },
  },
  {
    id: 'survivor_campfire_ash',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '아직 온기가 남은 모닥불 자리가 있습니다. 누군가 방금까지 이곳에 있었던 모양입니다.' }
    },
  },
  {
    id: 'survivor_whistle',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '짧은 휘파람 소리가 두 번 울립니다. 생존자들 사이의 신호인 듯하지만 뜻을 알 수 없습니다.' }
    },
  },
  {
    id: 'survivor_scavenger_nod',
    type: 'npc',
    weight: 1,
    safeOk: true,
    run() {
      return { message: '반대편에서 다가오던 생존자가 가볍게 고개를 끄덕이고는 말없이 지나쳐 갑니다.' }
    },
  },

  // ---------------- lore ----------------
  { id: 'rumor', type: 'lore', weight: 3, safeOk: true, run: () => ({ message: pick(RUMOR_LINES) }) },
  { id: 'broadcast', type: 'lore', weight: 3, safeOk: true, run: () => ({ message: pick(BROADCAST_LINES) }) },
  {
    id: 'old_photograph',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '빛바랜 사진 한 장이 떨어져 있습니다. 환하게 웃는 가족의 모습. 뒷면엔 날짜만 적혀 있습니다.' }),
  },
  {
    id: 'corporate_memo',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '구겨진 사내 메모: "비용 절감을 위해 보안 유닛의 교전 규칙을 완화함." 서명은 지워져 있습니다.' }),
  },
  {
    id: 'military_order',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '찢어진 군사 명령서 조각: "...첨탑 구역은 어떤 경우에도 사수한다..." 나머지는 읽을 수 없습니다.' }),
  },
  {
    id: 'personal_diary',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '누군가의 일기장: "오늘로 47일째. 로봇들은 아직도 우리를 못 알아본다. 그게 다행인지 모르겠다."' }),
  },
  {
    id: 'graffiti_warning',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '스프레이로 휘갈긴 낙서: "돌아가. 여긴 아무것도 없어."' }),
  },
  {
    id: 'recorded_message',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '작은 녹음기를 발견해 재생해봅니다. 지직거리는 잡음 속, 누군가의 울음소리뿐입니다.' }),
  },
  {
    id: 'newspaper_clipping',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '신문 스크랩: "통제소, 자동화 전면 도입 발표—사고율 0%대 달성 목표." 날짜는 정전 일주일 전입니다.' }),
  },
  {
    id: 'evacuation_map',
    type: 'lore',
    weight: 1,
    safeOk: true,
    run: () => ({ message: '색이 바랜 대피 경로 지도가 벽에 붙어 있습니다. 표시된 대피소들은 이미 다 무너진 곳들입니다.' }),
  },

  // ---------------- cache ----------------
  {
    id: 'hidden_cache',
    type: 'cache',
    weight: 2,
    safeOk: false,
    run(player) {
      const drops = [
        { itemId: 'power_cell', qty: 1 },
        { itemId: 'circuit_board', qty: 1 },
      ]
      for (const d of drops) addToInventory(player, d.itemId, d.qty)
      return { message: '벽 틈에 숨겨진 보급 캐시를 발견했습니다!', loot: drops }
    },
  },
  {
    id: 'vending_machine',
    type: 'cache',
    weight: 2,
    safeOk: true,
    run(player) {
      const itemId = pick(['ration_pack', 'water_canteen', 'energy_bar'])
      addToInventory(player, itemId, 1)
      return { message: '아직 전력이 남은 자판기를 억지로 열었습니다.', loot: [{ itemId, qty: 1 }] }
    },
  },
  {
    id: 'abandoned_backpack',
    type: 'cache',
    weight: 2,
    safeOk: false,
    run(player) {
      const itemId = pick(['scrap_metal', 'medkit', 'painkillers'])
      addToInventory(player, itemId, 1)
      return { message: '버려진 배낭 하나를 발견했습니다.', loot: [{ itemId, qty: 1 }] }
    },
  },
  {
    id: 'toolbox',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      const drops = [{ itemId: 'scrap_metal', qty: 2 }, { itemId: 'circuit_board', qty: 1 }]
      for (const d of drops) addToInventory(player, d.itemId, d.qty)
      return { message: '녹슨 공구함을 뒤져 쓸만한 부품을 챙겼습니다.', loot: drops }
    },
  },
  {
    id: 'medical_cabinet',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      const itemId = pick(['medkit', 'painkillers', 'antibiotics'])
      addToInventory(player, itemId, 1)
      return { message: '잠기지 않은 구급함을 발견했습니다.', loot: [{ itemId, qty: 1 }] }
    },
  },
  {
    id: 'fuel_drum',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      addToInventory(player, 'waste_oil_can', 1)
      return { message: '녹슨 드럼통 안에 아직 쓸만한 폐유가 남아 있습니다.', loot: [{ itemId: 'waste_oil_can', qty: 1 }] }
    },
  },
  {
    id: 'weapon_cache',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      const itemId = pick(['rusty_pipe', 'spike_knuckles', 'modified_wrench'])
      addToInventory(player, itemId, 1)
      return { message: '누군가 급히 숨겨놓은 듯한 즉석 무기를 발견했습니다.', loot: [{ itemId, qty: 1 }] }
    },
  },
  {
    id: 'supply_drop',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      const drops = [
        { itemId: 'power_cell', qty: 2 },
        { itemId: 'medkit', qty: 1 },
      ]
      for (const d of drops) addToInventory(player, d.itemId, d.qty)
      return { message: '오래전 떨어진 보급 상자를 발견했습니다. 낙하산이 아직도 걸려 있습니다.', loot: drops }
    },
  },
  {
    id: 'data_terminal_leftover',
    type: 'cache',
    weight: 1,
    safeOk: false,
    run(player) {
      addToInventory(player, 'data_core', 1)
      return { message: '파손된 단말기에서 분리된 데이터 코어 하나를 회수했습니다.', loot: [{ itemId: 'data_core', qty: 1 }] }
    },
  },
  {
    id: 'spare_parts_bin',
    type: 'cache',
    weight: 2,
    safeOk: false,
    run(player) {
      addToInventory(player, 'alloy_plate', 1)
      return { message: '분류되지 않은 부품함에서 합금 플레이트를 건졌습니다.', loot: [{ itemId: 'alloy_plate', qty: 1 }] }
    },
  },

  // ---------------- hazard ----------------
  {
    id: 'radiation_pocket',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = Math.max(2, Math.round(player.maxHp * 0.08))
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `방사능 농도가 급격히 치솟습니다! 서둘러 빠져나왔지만 ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'structural_collapse',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = 6 + Math.floor(Math.random() * 8)
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `천장 일부가 무너져 내렸습니다! ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'toxic_leak',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = 5 + Math.floor(Math.random() * 6)
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `균열에서 유독 가스가 새어 나옵니다. 급히 빠져나왔지만 ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'electrical_short',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = 4 + Math.floor(Math.random() * 5)
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `끊어진 전선에서 스파크가 튀며 감전됐습니다! ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'unstable_floor',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = 5 + Math.floor(Math.random() * 7)
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `바닥이 갑자기 꺼지며 아래로 떨어졌습니다! ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'falling_debris',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      const dmg = 3 + Math.floor(Math.random() * 6)
      player.hp = Math.max(1, player.hp - dmg)
      return { message: `위에서 잔해가 쏟아집니다! 피하려 했지만 ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
    },
  },
  {
    id: 'flooding_surge',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      player.fatigue = Math.min(100, player.fatigue + 12)
      return { message: '갑자기 물이 차올라 허우적대며 빠져나왔습니다. 체력이 급격히 소모됐습니다.', fatigueGain: 12 }
    },
  },
  {
    id: 'equipment_malfunction',
    type: 'hazard',
    weight: 1,
    safeOk: false,
    run(player) {
      player.hunger = Math.max(0, player.hunger - 5)
      player.thirst = Math.max(0, player.thirst - 5)
      return { message: '지나가던 배관이 터져 식수와 식량 일부가 못 쓰게 됐습니다.' }
    },
  },

  // ---------------- choice (branching) ----------------
  {
    id: 'wounded_survivor',
    type: 'choice',
    weight: 1,
    safeOk: true,
    prompt: '피투성이가 된 생존자가 길목에 쓰러져 있습니다. 응급 처치 키트가 있다면 살릴 수 있을 것 같습니다.',
    choices: [
      { id: 'help', label: '응급 키트를 사용해 돕는다' },
      { id: 'ignore', label: '그냥 지나친다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'help') {
        if (itemCount(player, 'medkit') > 0) {
          removeFromInventory(player, 'medkit', 1)
          const xpGain = 15
          return { message: '생존자를 살렸습니다. 그는 고마움의 표시로 가진 것을 나눠주고 떠났습니다.', xpGain }
        }
        return { message: '도우려 했지만 응급 키트가 없습니다. 생존자는 눈을 감았습니다.' }
      }
      return { message: '마음을 다잡고 지나쳤습니다. 뒤돌아보지 않았습니다.' }
    },
  },
  {
    id: 'locked_safe',
    type: 'choice',
    weight: 1,
    safeOk: false,
    prompt: '녹슬었지만 단단히 잠긴 금고를 발견했습니다. 억지로 열면 소리가 날 수 있습니다.',
    choices: [
      { id: 'force', label: '힘으로 비틀어 연다 (피해 위험)' },
      { id: 'leave', label: '포기하고 자리를 뜬다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'force') {
        if (Math.random() < 0.6) {
          const drops = [{ itemId: 'power_cell', qty: 2 }, { itemId: 'data_core', qty: 1 }]
          for (const d of drops) addToInventory(player, d.itemId, d.qty)
          return { message: '금고를 비트는 데 성공했습니다. 안에 귀중한 부품이 가득합니다.', loot: drops }
        }
        const dmg = 8 + Math.floor(Math.random() * 6)
        player.hp = Math.max(1, player.hp - dmg)
        return { message: `금고가 요란한 소리와 함께 튕겨 나와 손을 다쳤습니다. ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
      }
      return { message: '괜한 소음을 내지 않기로 했습니다.' }
    },
  },
  {
    id: 'strange_terminal',
    type: 'choice',
    weight: 1,
    safeOk: true,
    prompt: '아직 전원이 들어오는 단말기를 발견했습니다. 접속을 시도하면 무언가 반응할지도 모릅니다.',
    choices: [
      { id: 'access', label: '단말기에 접속을 시도한다' },
      { id: 'leave', label: '건드리지 않는다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'access') {
        if (Math.random() < 0.65) {
          addToInventory(player, 'data_core', 1)
          return { message: '오래된 보안을 우회해 데이터 코어 하나를 복사하는 데 성공했습니다.', loot: [{ itemId: 'data_core', qty: 1 }] }
        }
        player.fatigue = Math.min(100, player.fatigue + 15)
        return { message: '단말기가 경고음과 함께 잠겨버렸습니다. 괜히 시간과 체력만 허비했습니다.', fatigueGain: 15 }
      }
      return { message: '위험을 감수하지 않기로 했습니다.' }
    },
  },
  {
    id: 'damaged_drone_plea',
    type: 'choice',
    weight: 1,
    safeOk: false,
    prompt: '움직이지 못하는 소형 드론이 바닥에 쓰러져 있습니다. 부품으로 해체할지, 그냥 둘지 선택할 수 있습니다.',
    choices: [
      { id: 'salvage', label: '부품을 해체해 챙긴다' },
      { id: 'leave', label: '그냥 둔다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'salvage') {
        const drops = [{ itemId: 'scrap_metal', qty: 2 }, { itemId: 'circuit_board', qty: 1 }]
        for (const d of drops) addToInventory(player, d.itemId, d.qty)
        return { message: '드론을 분해해 쓸만한 부품을 챙겼습니다.', loot: drops }
      }
      return { message: '이미 멈춘 기계를 건드리지 않기로 했습니다.' }
    },
  },
  {
    id: 'gas_shortcut',
    type: 'choice',
    weight: 1,
    safeOk: false,
    prompt: '가스 냄새가 나는 좁은 통로가 지름길처럼 보입니다. 빠르게 통과할지, 돌아갈지 선택해야 합니다.',
    choices: [
      { id: 'rush', label: '숨을 참고 빠르게 통과한다' },
      { id: 'detour', label: '돌아간다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'rush') {
        if (Math.random() < 0.5) {
          return { message: '숨을 참고 무사히 통과했습니다. 시간을 아꼈습니다.' }
        }
        const dmg = 6 + Math.floor(Math.random() * 5)
        player.hp = Math.max(1, player.hp - dmg)
        return { message: `가스를 들이마시고 말았습니다. ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
      }
      player.fatigue = Math.min(100, player.fatigue + 8)
      return { message: '먼 길로 돌아갔습니다. 체력이 조금 소모됐습니다.', fatigueGain: 8 }
    },
  },
  {
    id: 'survivor_trade_offer',
    type: 'choice',
    weight: 1,
    safeOk: true,
    prompt: '한 생존자가 고철 조각 3개를 주면 자신이 가진 물건과 바꾸겠다고 제안합니다.',
    choices: [
      { id: 'trade', label: '고철 3개를 주고 교환한다' },
      { id: 'decline', label: '거절한다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'trade') {
        if (itemCount(player, 'scrap_metal') < 3) {
          return { message: '고철이 부족합니다. 생존자는 아쉬운 표정으로 떠났습니다.' }
        }
        removeFromInventory(player, 'scrap_metal', 3)
        const itemId = pick(['medkit', 'stim_pack', 'water_canteen', 'optic_lens'])
        addToInventory(player, itemId, 1)
        return { message: `거래가 성사됐습니다. ${getItem(itemId).name}을(를) 받았습니다.`, loot: [{ itemId, qty: 1 }] }
      }
      return { message: '제안을 정중히 거절했습니다.' }
    },
  },
  {
    id: 'hostile_standoff',
    type: 'choice',
    weight: 1,
    safeOk: false,
    prompt: '경계하는 눈빛의 생존자와 마주쳤습니다. 서로 무기를 겨눈 채 긴장이 흐릅니다.',
    choices: [
      { id: 'back_down', label: '천천히 물러난다' },
      { id: 'push_through', label: '밀어붙이고 지나간다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'push_through') {
        if (Math.random() < 0.5) {
          return { message: '상대가 먼저 물러났습니다. 아무 일도 없었습니다.' }
        }
        const dmg = 5 + Math.floor(Math.random() * 6)
        player.hp = Math.max(1, player.hp - dmg)
        return { message: `몸싸움이 벌어졌습니다. ${dmg}의 피해를 입었지만 결국 지나갔습니다.`, hpLoss: dmg }
      }
      return { message: '천천히 뒷걸음질 쳐서 상황을 피했습니다.' }
    },
  },
  {
    id: 'old_bunker_cache',
    type: 'choice',
    weight: 1,
    safeOk: false,
    prompt: '녹슨 해치 아래로 작은 공간이 보입니다. 비좁아 보이지만 들어갈 수는 있을 것 같습니다.',
    choices: [
      { id: 'enter', label: '비좁은 틈으로 들어간다' },
      { id: 'skip', label: '지나친다' },
    ],
    resolve(player, choiceId) {
      if (choiceId === 'enter') {
        if (Math.random() < 0.55) {
          addToInventory(player, 'nanite_gel', 1)
          return { message: '좁은 공간 안쪽에서 손상되지 않은 나나이트 겔을 발견했습니다.', loot: [{ itemId: 'nanite_gel', qty: 1 }] }
        }
        const dmg = 4 + Math.floor(Math.random() * 5)
        player.hp = Math.max(1, player.hp - dmg)
        return { message: `날카로운 잔해에 긁혔습니다. ${dmg}의 피해를 입었습니다.`, hpLoss: dmg }
      }
      return { message: '위험을 감수하지 않기로 했습니다.' }
    },
  },
]

function pickWeightedEvent(pool) {
  const total = pool.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * total
  for (const e of pool) {
    if (roll < e.weight) return e
    roll -= e.weight
  }
  return pool[pool.length - 1]
}

const LORE_EVENT_COUNT = EVENTS.filter((e) => e.type === 'lore' && e.id !== 'rumor' && e.id !== 'broadcast').length
export const TOTAL_LORE_ENTRIES = RUMOR_LINES.length + BROADCAST_LINES.length + LORE_EVENT_COUNT

export function rollRandomEvent(player, location) {
  const pool = EVENTS.filter((e) => (location.isSafe ? e.safeOk : true))
  const event = pickWeightedEvent(pool)

  if (event.type === 'choice') {
    player.pendingEvent = { eventId: event.id, prompt: event.prompt, choices: event.choices }
    return { eventId: event.id, eventType: 'choice', prompt: event.prompt, choices: event.choices }
  }

  const result = event.run(player)
  return { eventId: event.id, eventType: event.type, ...result }
}

export function getEvent(id) {
  return EVENTS.find((e) => e.id === id) ?? null
}
