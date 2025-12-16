"use client";

import { ChangeEvent, useCallback, useRef, useState } from "react";

import styles from "./page.module.css";

type Keyword = {
  term: string;
  score: number;
};

type DocumentInsights = {
  pageCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  topKeywords: Keyword[];
  sentences: string[];
  summary: string[];
  textPreview: string;
};

type DocumentMetadata = {
  title: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modDate: string | null;
};

type AnalysisResponse = {
  insights: DocumentInsights;
  metadata: DocumentMetadata;
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const requestAnalysis = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Une erreur inattendue est survenue.");
      }

      const payload = (await response.json()) as AnalysisResponse;
      setResult(payload);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible d'analyser ce document, veuillez réessayer.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const onFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      setSelectedFileName(file.name);
      void requestAnalysis(file);
    },
    [requestAnalysis],
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Analyseur intelligent de PDF</h1>
          <p className={styles.subtitle}>
            Importez un document PDF pour obtenir automatiquement les mots clés
            dominants, une estimation du temps de lecture, ainsi qu&apos;un
            résumé synthétique des points essentiels.
          </p>
        </header>

        <section
          className={styles.uploadArea}
          role="button"
          tabIndex={0}
          onClick={triggerFileSelect}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              triggerFileSelect();
            }
          }}
        >
          <p className={styles.uploadText}>
            {selectedFileName
              ? `Document sélectionné : ${selectedFileName}`
              : "Déposez votre PDF ici ou cliquez pour sélectionner un fichier"}
          </p>
          <p className={styles.hint}>Taille maximale : 15 Mo</p>
          <button
            type="button"
            className={styles.button}
            onClick={(event) => {
              event.stopPropagation();
              triggerFileSelect();
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyse en cours..." : "Choisir un fichier PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={onFileSelected}
            className={styles.hiddenInput}
          />
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        {isAnalyzing ? (
          <p className={styles.loading}>
            <span className="spinner" />
            Analyse du document en cours...
          </p>
        ) : null}

        {result ? (
          <section className={styles.results}>
            <div className={styles.overview}>
              <h2 className={styles.overviewTitle}>Vue d&apos;ensemble</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Pages</span>
                  <span className={styles.statValue}>
                    {result.insights.pageCount}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Mots</span>
                  <span className={styles.statValue}>
                    {result.insights.wordCount}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Lecture estimée</span>
                  <span className={styles.statValue}>
                    {result.insights.readingTimeMinutes} min
                  </span>
                </div>
              </div>
              <div>
                <h3 className={styles.summaryTitle}>Mots clés</h3>
                <div className={styles.keywords}>
                  {result.insights.topKeywords.length === 0 ? (
                    <span>Aucun mot clé saillant détecté.</span>
                  ) : (
                    result.insights.topKeywords.map((keyword) => (
                      <span key={keyword.term} className={styles.keyword}>
                        {keyword.term}
                        <small>×{keyword.score}</small>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Résumé automatique</h2>
              <div className={styles.summaryList}>
                {result.insights.summary.length === 0 ? (
                  <p>Le texte extrait est trop court pour générer un résumé.</p>
                ) : (
                  result.insights.summary.map((sentence, index) => (
                    <p key={`${sentence}-${index}`}>{sentence}</p>
                  ))
                )}
              </div>
            </div>

            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Métadonnées du document</h2>
              <div className={styles.metadata}>
                <span>
                  <strong>Titre :</strong>{" "}
                  {result.metadata.title ?? "Non spécifié"}
                </span>
                <span>
                  <strong>Auteur :</strong>{" "}
                  {result.metadata.author ?? "Non spécifié"}
                </span>
                <span>
                  <strong>Créateur :</strong>{" "}
                  {result.metadata.creator ?? "Non spécifié"}
                </span>
                <span>
                  <strong>Producteur :</strong>{" "}
                  {result.metadata.producer ?? "Non spécifié"}
                </span>
                <span>
                  <strong>Date de création :</strong>{" "}
                  {result.metadata.creationDate ?? "Non spécifié"}
                </span>
                <span>
                  <strong>Dernière modification :</strong>{" "}
                  {result.metadata.modDate ?? "Non spécifié"}
                </span>
              </div>
            </div>

            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Aperçu du texte</h2>
              <div className={styles.preview}>
                {result.insights.textPreview || "Aucun texte disponible."}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

