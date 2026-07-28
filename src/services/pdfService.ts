import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { AnalysisResult } from '../types/contract';

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');

  html = html.replace(/(<li>.*?<\/li>)/g, match => {
    return `<ul>${match}</ul>`;
  });
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  return html;
}

const riskColors: Record<string, string> = {
  bajo: '#22C55E',
  medio: '#F59E0B',
  alto: '#EF4444',
};

function buildHtml(result: AnalysisResult): string {
  const bodyHtml = markdownToHtml(result.report);

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; padding: 24px; color: #111827; line-height: 1.6; }
        h1 { font-size: 22px; margin-bottom: 16px; }
        h2 { font-size: 18px; margin-top: 20px; margin-bottom: 8px; }
        h3 { font-size: 16px; margin-top: 16px; margin-bottom: 8px; }
        .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .risk { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-weight: bold; font-size: 12px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 4px; }
        hr { border: none; border-top: 1px solid #E5E7EB; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <h1 style="margin:0">Análisis de Contrato</h1>
        <span class="risk" style="background:${riskColors[result.riskLevel]}">Riesgo: ${result.riskLevel.toUpperCase()}</span>
      </div>
      ${bodyHtml}
    </body>
    </html>
  `;
}

export async function shareAsPdf(result: AnalysisResult): Promise<void> {
  const html = buildHtml(result);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir análisis de contrato',
    });
  }
}
