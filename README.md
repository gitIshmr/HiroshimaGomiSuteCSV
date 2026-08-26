# 広島市ごみ収集日カレンダー (HiroshimaGomiSuteCSV)

[![Update CSV Data](https://github.com/gitIshmr/HiroshimaGomiSuteCSV/actions/workflows/fetch_csv.yml/badge.svg)](https://github.com/gitIshmr/HiroshimaGomiSuteCSV/actions/workflows/fetch_csv.yml)
[![Deploy to GitHub Pages](https://github.com/gitIshmr/HiroshimaGomiSuteCSV/actions/workflows/deploy.yml/badge.svg)](https://github.com/gitIshmr/HiroshimaGomiSuteCSV/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

広島市が公開している公式オープンデータ（家庭ごみ収集日程表）をもとに、お使いのスマートフォンやパソコンのカレンダー（Google カレンダー、iPhone/Mac カレンダー等）へ簡単に登録できる iCalendar (`.ics`) ファイルを生成・ダウンロードできる Web サービスです。

🔗 **Web ツール URL**: [https://gitishmr.github.io/HiroshimaGomiSuteCSV/](https://gitishmr.github.io/HiroshimaGomiSuteCSV/)

---

## 🌟 主な特徴

- 📍 **広島市全8区・全町名に対応**  
  中区、東区、南区、西区、安佐南区、安佐北区、安芸区、佐伯区のすべての町名に対応しています。
- 📅 **一括登録（.ics 形式）**  
  区と町名を選択するだけで、収集日スケジュールがまとまった iCalendar (`.ics`) ファイルをその場で作成できます。
- 🤖 **最新データの自動同期 (GitHub Actions)**  
  毎日 1 回、広島県のオープンデータポータルから最新の収集日データ（CSV）を全自動で取得・更新しています。
- ⚡ **サーバーレス & 高速動作**  
  GitHub Pages 上で動作する軽量な静的 Web アプリケーションです。

---

## 🚀 使い方

1. **[Web サイト](https://gitishmr.github.io/HiroshimaGomiSuteCSV/) にアクセス**
2. **ステップ 1**: お住まいの「区」を選択
3. **ステップ 2**: お住まいの「町名」を選択し、「ごみ収集カレンダー（.ics）を保存する」ボタンをクリック
4. ダウンロードされた `GomiCalendar.ics` をお使いのカレンダーアプリに取り込みます。

### 📲 カレンダーアプリへの登録手順

- **iPhone / iPad / Mac の場合**  
  ダウンロードした `GomiCalendar.ics` ファイルをタップ/ダブルクリックして開くことで、OS標準の「カレンダー」アプリにそのまま一括登録できます。
- **Google カレンダーの場合**  
  1. パソコンから [Google カレンダー](https://calendar.google.com/) にアクセスします。
  2. 右上の歯車アイコン ⚙️ > **「設定」** を開きます。
  3. 左メニューの **「インポート/エクスポート」** を選択します。
  4. パソコンから選択で `GomiCalendar.ics` をアップロードし、インポート先のカレンダーを指定して **「インポート」** をクリックします。  
     *(詳細: [Google カレンダー公式ヘルプ](https://support.google.com/calendar/answer/37118?hl=ja))*

---

## 🛠️ アーキテクチャと更新の仕組み

### ディレクトリ構造

```text
HiroshimaGomiSuteCSV/
├── .github/
│   └── workflows/
│       ├── fetch_csv.yml   # 毎日オープンデータから最新CSVを自動取得・コミット
│       └── deploy.yml      # master/main ブランチへの変更時に GitHub Pages へ自動デプロイ
├── data/
│   └── csv/                # 抽出・文字コード変換(UTF-8)済みの広島市ごみ収集日CSV群
├── scripts/
│   └── process_data.py     # オープンデータZIPのダウンロード・UTF-8変換処理スクリプト
├── index.html              # ユーザーインターフェース (HTML5)
├── main.js                 # JSモジュール (CSV読み込み & .ics生成)
├── lit.css / main.css      # スタイルシート
└── LICENSE                 # ライセンスファイル
```

### 自動データ更新パイプライン

GitHub Actions (`fetch_csv.yml`) により、毎朝 2:00 JST (`17:00 UTC`) に以下のステップが自動実行されます：

1. [広島広域都市圏・広島県オープンデータポータル](https://hiroshima-opendata.dataeye.jp/resources/9971) から最新のごみ収集データ ZIP ファイルをダウンロード。
2. `scripts/process_data.py` が ZIP を解凍し、Shift_JIS から UTF-8 へ文字コード変換を行った上で `data/csv/` ディレクトリに配置。
3. 差分が存在する場合のみ `github-actions[bot]` によりリポジトリへ自動コミット＆プッシュ。
4. コミットをフックして `deploy.yml` が起動し、最新版を GitHub Pages へ自動デプロイ。

---

## 💻 ローカル開発・動作確認

本プロジェクトは特別なビルドツールを必要としない静的Webアプリケーションです。

1. **リポジトリをクローン**:
   ```bash
   git clone https://github.com/gitIshmr/HiroshimaGomiSuteCSV.git
   cd HiroshimaGomiSuteCSV
   ```

2. **簡易ローカルサーバーを起動** (例: Python 3 の場合):
   ```bash
   python -m http.server 8000
   ```

3. ブラウザで `http://localhost:8000` にアクセスします。

---

## 📄 データ出典・著作権表示

本ツールで使用しているごみ収集日程データは、広島市環境局が公開している公式オープンデータをもとに作成されています。

- **データ提供元**: [広島広域都市圏・広島県オープンデータポータルサイト](https://hiroshima-opendata.dataeye.jp/resources/9971)
- **利用規約**: [広島市オープンデータ利用規約](https://www.city.hiroshima.lg.jp/soshiki/16/11807.html) (クリエイティブ・コモンズ 表示 4.0 国際 ライセンス / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja))

---

## 📜 ライセンス

プログラムのコードは [MIT License](LICENSE) のもとで公開されています。

&copy; 2018-2026 [gitIshmr](https://github.com/gitIshmr)
