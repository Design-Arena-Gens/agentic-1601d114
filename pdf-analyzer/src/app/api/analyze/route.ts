import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

import { buildInsights } from "@/lib/textAnalysis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Aucun fichier valide trouvé dans la requête." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Le fichier envoyé est vide." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error:
            "Le fichier dépasse la taille maximale autorisée (15 Mo). Merci de fournir un document plus léger.",
        },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text ?? "";

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "Impossible d'extraire du texte de ce document PDF. Vérifiez qu'il n'est pas scanné en image.",
        },
        { status: 422 },
      );
    }

    const insights = buildInsights(text, pdfData.numpages ?? 0);

    return NextResponse.json({
      insights,
      metadata: {
        title: pdfData.info?.Title ?? null,
        author: pdfData.info?.Author ?? null,
        creator: pdfData.info?.Creator ?? null,
        producer: pdfData.info?.Producer ?? null,
        creationDate: pdfData.info?.CreationDate ?? null,
        modDate: pdfData.info?.ModDate ?? null,
      },
    });
  } catch (error) {
    console.error("PDF analysis failed:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur inattendue est survenue lors de l'analyse du document.",
      },
      { status: 500 },
    );
  }
}

