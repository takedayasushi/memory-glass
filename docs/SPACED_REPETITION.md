# Memory Glass — SM-2 間隔反復アルゴリズム解説

本ドキュメントでは、Memory Glass のフラッシュカード復習機能の核となる **SuperMemo-2 (SM-2) アルゴリズム** について、数式・実装コード・具体的なシミュレーション例を交えて詳細に解説します。

---

## 1. 間隔反復（Spaced Repetition）とは

人間の脳は、一度覚えた情報を時間とともに指数的に忘れていきます（**エビングハウスの忘却曲線**）。

```
記憶の定着率
100% ┤████████
 80% ┤██████
 60% ┤████
 40% ┤███
 20% ┤██
  0% ┤█
     └──┬──┬──┬──┬──┬──┬──→ 時間
       1h  1d  3d  1w  2w  1m
```

間隔反復とは、「忘れかける直前」のタイミングで復習することで、最小限の労力で長期記憶への定着率を最大化する学習手法です。SM-2 アルゴリズムは、この「最適な復習タイミング」を数学的に計算します。

---

## 2. SM-2 アルゴリズムの核心

### 2.1 評価スコア（Quality）

ユーザーがフラッシュカードの裏面で押すボタンが、アルゴリズムへの入力となります。

| ボタン | quality 値 | 意味 | アルゴリズムへの影響 |
|---|---|---|---|
| **Forgot** | `1` | 完全に忘れていた | interval をリセット（1日に戻す） |
| **Hard** | `3` | 思い出せたが苦労した | interval を維持/微増 |
| **Good** | `4` | 少し考えて思い出せた | interval を順調に延長 |
| **Easy** | `5` | 即座に思い出せた | interval を大きく延長 |

### 2.2 復習間隔（Interval）の計算

復習間隔は以下のロジックで決定されます。

```
if quality < 3:
    interval = 1                    # 忘れた → 翌日に再出題
else:
    if interval == 0: interval = 1  # 初回 → 翌日
    if interval == 1: interval = 6  # 2回目 → 6日後
    else: interval = round(interval × easeFactor)  # 3回目以降 → 指数的に増加
```

**実装コード** (`Flashcard.jsx` L11-19):

```javascript
let newInterval = card.interval || 0;

if (quality < 3) {
    newInterval = 1;                           // Forgot → リセット
} else {
    if (newInterval === 0) newInterval = 1;    // 初回: 1日後
    else if (newInterval === 1) newInterval = 6; // 2回目: 6日後
    else newInterval = Math.round(newInterval * newEaseFactor); // 3回目以降: 指数増加
}
```

### 2.3 難易度係数（EaseFactor）の更新

EaseFactor は「そのカードがどれだけ覚えやすいか」を表す浮動小数点数です。

**更新公式:**

```
EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
```

ここで:
- `EF` = 現在の EaseFactor
- `q` = ユーザーの評価スコア (1〜5)
- `EF'` = 更新後の EaseFactor（下限: 1.3）

**各 quality での EaseFactor の変化量:**

| quality | 計算式 | 変化量 | 解釈 |
|---|---|---|---|
| 5 (Easy) | `0.1 - 0×(0.08 + 0×0.02)` | **+0.10** | 「簡単」→ 次回の間隔がより長くなる |
| 4 (Good) | `0.1 - 1×(0.08 + 1×0.02)` | **+0.00** | 「普通」→ 現状維持 |
| 3 (Hard) | `0.1 - 2×(0.08 + 2×0.02)` | **-0.14** | 「難しい」→ 次回の間隔が短くなる |
| 1 (Forgot) | `0.1 - 4×(0.08 + 4×0.02)` | **-0.54** | 「忘れた」→ 大幅に間隔が短縮される |

**実装コード** (`Flashcard.jsx` L22-23):

```javascript
newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
if (newEaseFactor < 1.3) newEaseFactor = 1.3;  // 下限ガード
```

### 2.4 次回復習日（NextReviewDate）の設定

```javascript
const nextDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
```

現在時刻から `interval` 日後のタイムスタンプを計算し、Firestore に保存します。

---

## 3. シミュレーション例

あるカードを毎回「Good」（quality = 4）で回答し続けた場合の、パラメータの推移を示します。

| 復習回 | 操作 | interval | easeFactor | 次回復習日 |
|---|---|---|---|---|
| 初期状態 | — | 0 | 2.50 | 即時（作成日） |
| 1回目 | Good (4) | **1日** | 2.50 | 翌日 |
| 2回目 | Good (4) | **6日** | 2.50 | 1週間後 |
| 3回目 | Good (4) | **15日** | 2.50 | 約2週間後 |
| 4回目 | Good (4) | **38日** | 2.50 | 約1ヶ月後 |
| 5回目 | Good (4) | **95日** | 2.50 | 約3ヶ月後 |
| 6回目 | Good (4) | **238日** | 2.50 | 約8ヶ月後 |

> 「Good」を押し続けると、復習間隔が **1日 → 6日 → 15日 → 38日 → 95日 → 238日** と指数的に伸びていきます。これにより「もう十分覚えた」カードに無駄な時間を使わずに済みます。

### 途中で「Forgot」した場合

| 復習回 | 操作 | interval | easeFactor | 次回復習日 |
|---|---|---|---|---|
| 4回目 | Good (4) | 38日 | 2.50 | 約1ヶ月後 |
| 5回目 | **Forgot (1)** | **1日** | **1.96** | **翌日** |
| 6回目 | Good (4) | **1日** | 1.96 | 翌日 |
| 7回目 | Good (4) | **6日** | 1.96 | 1週間後 |
| 8回目 | Good (4) | **12日** | 1.96 | 約2週間後 |

> 「Forgot」を押すと interval が 1日にリセットされ、easeFactor も下がります。結果として、その後の間隔の伸びが緩やかになり、「苦手なカード」はより頻繁に出題されるようになります。

---

## 4. Firestore に保存されるデータ

SM-2 の計算結果は、Firestore の各カードドキュメントに以下のフィールドとして保存されます。

```
users/{uid}/cards/{cardId}
├── interval: 15          # 次の復習まで15日空ける
├── easeFactor: 2.36      # やや易しめ（標準は2.5）
├── nextReviewDate: ...   # 2026-05-18T07:30:00Z
└── repetitions: 0        # （将来の拡張用、現在は未使用）
```

### フロントエンドからの直接更新

復習ボタンの押下による SM-2 計算と Firestore 更新は、**バックエンドを経由せず、フロントエンドから直接行われます**。

```javascript
// Flashcard.jsx — Firestore Client SDK で直接更新
const cardRef = doc(db, 'users', user.uid, 'cards', card.id);
await updateDoc(cardRef, {
  interval: newInterval,
  easeFactor: Number(newEaseFactor.toFixed(2)),
  nextReviewDate: nextDate
});
```

この操作は Firestore Security Rules（`request.auth.uid == userId`）によって保護されており、自分のカードしか更新できません。

---

## 5. 参考文献

- [SuperMemo-2 Algorithm](https://super-memory.com/english/ol/sm2.htm) — Piotr Wozniak による原論文
- [Anki Manual — Spaced Repetition](https://docs.ankiweb.net/studying.html) — 最も有名な SM-2 実装である Anki の公式ドキュメント
