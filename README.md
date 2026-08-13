# 色集め (iro-atsume)

スマホのカメラで街の色を撮影し、タップした点の色を日本の伝統色250色に照合して集める個人用PWA。

## セットアップ

```bash
npm install
cp .env.example .env   # DATABASE_URL に Neon の接続文字列を設定
npx prisma migrate dev --name init
npm run dev
```

`http://localhost:3000` を開く。PCでは通常のファイル選択ダイアログが開くので、既存の画像で動作確認できる（`capture`属性はデスクトップでは無視される）。

## 実機での確認

カメラ・位置情報の取得にはHTTPS（またはlocalhost）が必須。`http://192.168.x.x`では動かないので、Vercelにデプロイしてプレビュー/本番URLをスマホで直接開いて確認する。

## アイコンの再生成

配色やデザインを変更した場合:

```bash
npm run icons
```

`public/icons/icon-192.png` / `icon-512.png` を再生成する。生成後は必ずコミットすること。

## データについて

`src/lib/traditional-colors.ts` の伝統色250色は [nipponcolors.com](https://nipponcolors.com) のデータを、`colorsea` npm パッケージ（MIT License, © waterbeside）経由で一度だけ抽出したもの。ランタイム依存はしていない。
