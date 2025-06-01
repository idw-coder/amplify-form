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

    // FastAPIへ送信するFormDataを作成
    const formData = new FormData();
    formData.append("file", new Blob([buffer], { type: file.type }), file.name);

    const fastApiResponse = await fetch("https://nngg2zrdpm.ap-northeast-1.awsapprunner.com/", {
      method: "POST",
      body: formData,
    });

    const fastApiResult = await fastApiResponse.json();
    console.log("FastAPIの応答:", fastApiResult);

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
