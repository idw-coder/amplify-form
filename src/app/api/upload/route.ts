import { NextRequest, NextResponse } from "next/server";
// import { writeFile } from "fs/promises";
// import path from "path";
// import os from "os";

export async function POST(request: NextRequest) {
  try {
    // FormDataを取得
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      console.log("ファイルがありません");
      return NextResponse.json(
        { error: "ファイルがありません" },
        { status: 400 }
      );
    }

    console.log("受信したファイル:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // PDFファイルかチェック
    if (file.type !== "application/pdf") {
      console.log("PDFファイルではありません:", file.type);
      return NextResponse.json(
        { error: "PDFファイルのみ受け付けます" },
        { status: 400 }
      );
    }

    // ファイルをバイト配列に変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名を生成（タイムスタンプ付きで重複を防ぐ）
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;

    // // OSごとに適切な一時フォルダを取得
    // const tempDir = os.tmpdir();
    // const uploadPath = path.join(tempDir, fileName);

    // // ファイルを保存
    // await writeFile(uploadPath, buffer);
    // console.log("ファイルを保存しました:", uploadPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file.name}"`,
      },
    });
  } catch (error) {
    console.error("APIエラー:", error);
    return NextResponse.json(
      { error: "ファイル保存に失敗しました" },
      { status: 500 }
    );
  }
}

// GETメソッドでAPIの動作確認
export async function GET() {
  return NextResponse.json({
    message: "PDF Upload API is working",
    timestamp: new Date().toISOString(),
  });
}
