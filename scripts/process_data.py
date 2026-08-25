import os
import glob
import zipfile
import subprocess
import shutil

def detect_zip_filename_encoding(zip_path):
    """ZIPアーカイブ内のファイル名の文字コードを調べる."""
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for info in zf.infolist():
            # UTF-8 フラグビットが立っている場合は UTF-8
            if info.flag_bits & 0x800:
                continue

            raw_bytes = None
            try:
                raw_bytes = info.filename.encode('cp437')
            except Exception:
                pass

            if raw_bytes:
                try:
                    raw_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    # UTF-8でデコードできないバイトがある場合、CP932と判定
                    return 'cp932'
    return 'utf-8'

def extract_zip(zip_path, output_dir):
    """文字コードを調べてZIPを展開する."""
    os.makedirs(output_dir, exist_ok=True)
    encoding = detect_zip_filename_encoding(zip_path)
    print(f"Detected ZIP filename encoding: {encoding}")

    extracted = False
    if encoding != 'utf-8':
        # unzip -O <encoding> の実行を試みる
        try:
            res = subprocess.run(
                ['unzip', '-O', encoding, '-j', '-o', zip_path, '-d', output_dir],
                capture_output=True,
                text=True
            )
            if res.returncode == 0:
                print(f"Successfully unzipped using 'unzip -O {encoding}'")
                extracted = True
            else:
                print(f"'unzip -O' failed: {res.stderr.strip()}")
        except Exception as e:
            print(f"'unzip' command execution failed: {e}")

    if not extracted:
        # Pythonによる自前解凍（フォールバック）
        print("Extracting ZIP using Python fallback...")
        with zipfile.ZipFile(zip_path, 'r') as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue

                filename = info.filename
                if not (info.flag_bits & 0x800):
                    try:
                        raw_bytes = info.filename.encode('cp437')
                        for enc in ['cp932', 'shift_jis', 'euc_jp']:
                            try:
                                filename = raw_bytes.decode(enc)
                                break
                            except UnicodeDecodeError:
                                pass
                    except Exception:
                        pass

                base_name = os.path.basename(filename)
                if not base_name:
                    continue

                target_path = os.path.join(output_dir, base_name)
                with zf.open(info) as src, open(target_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)

        print("Python fallback extraction completed.")

def convert_csv_to_utf8(csv_dir):
    """CSV本文の文字コードを調べて UTF-8 に変換する."""
    csv_files = glob.glob(os.path.join(csv_dir, '*.csv'))
    print(f"Found {len(csv_files)} CSV files for encoding conversion.")

    for csv_file in csv_files:
        filename = os.path.basename(csv_file)
        with open(csv_file, 'rb') as f:
            content = f.read()

        detected_enc = None

        # 1. UTF-8 でデコード可能かテスト
        try:
            content.decode('utf-8')
            detected_enc = 'utf-8'
        except UnicodeDecodeError:
            pass

        # 2. UTF-8 でない場合、他の日本語文字コードを判定
        if detected_enc is None:
            for enc in ['cp932', 'shift_jis', 'euc_jp', 'iso2022_jp']:
                try:
                    content.decode(enc)
                    detected_enc = enc
                    break
                except UnicodeDecodeError:
                    continue

        if detected_enc is None:
            print(f"Warning: Could not detect encoding for {filename}, skipping.")
            continue

        print(f"File: {filename} | Detected encoding: {detected_enc}")

        if detected_enc != 'utf-8':
            text = content.decode(detected_enc)
            with open(csv_file, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
            print(f"  -> Converted {filename} from {detected_enc} to UTF-8")
        else:
            print(f"  -> {filename} is already UTF-8")

def main():
    zip_path = 'data.zip'
    output_dir = os.path.join('data', 'csv')

    if not os.path.exists(zip_path):
        print(f"Error: {zip_path} does not exist.")
        return

    extract_zip(zip_path, output_dir)
    convert_csv_to_utf8(output_dir)

if __name__ == '__main__':
    main()
