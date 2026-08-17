"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import twitterText from "twitter-text";

const tones = ["Admiración", "Apoyo a la tendencia", "Emocionante", "Romántico", "Divertido", "Agradecimiento"];
const protagonists = ["Ling", "Orm", "LingOrm"];
const languages = ["Español", "English", "Português"];
const languageHistoryKey = (language: string) => `lingorm-message-history-${language}`;
const fallback: Record<string, Record<string, string[]>> = {
  Admiración: {
    Ling: ["Ling convierte cada momento en algo inolvidable con su talento y elegancia.", "La presencia de Ling transmite confianza, talento y una belleza verdaderamente especial.", "Cada aparición de Ling demuestra por qué inspira tanta admiración en todo el mundo."],
    Orm: ["Orm ilumina cada momento con su carisma, talento y una energía imposible de ignorar.", "La autenticidad de Orm hace que cada proyecto se sienta todavía más especial.", "Cada aparición de Orm refleja talento, dedicación y una presencia maravillosa."],
    LingOrm: ["Ling y Orm brillan con una conexión que convierte cada momento en algo memorable.", "El talento y la complicidad de LingOrm hacen que cada proyecto sea verdaderamente especial.", "LingOrm inspira admiración con su química, dedicación y presencia incomparable."],
  },
  "Apoyo a la tendencia": {
    Ling: ["Seguimos apoyando a Ling con mensajes positivos y toda nuestra dedicación.", "Unimos nuestras voces para celebrar el trabajo y el talento de Ling.", "Hoy acompañamos a Ling con entusiasmo, constancia y mucho cariño."],
    Orm: ["Seguimos apoyando a Orm con mensajes positivos y toda nuestra dedicación.", "Unimos nuestras voces para celebrar el trabajo y el talento de Orm.", "Hoy acompañamos a Orm con entusiasmo, constancia y mucho cariño."],
    LingOrm: ["Unimos nuestras voces para apoyar a LingOrm con entusiasmo y mensajes positivos.", "Seguimos impulsando esta tendencia para celebrar juntas el talento de LingOrm.", "Acompañamos a LingOrm con constancia, respeto y todo nuestro apoyo."],
  },
  Emocionante: {
    Ling: ["Qué emoción acompañar a Ling en un momento tan importante y especial.", "Cada nueva etapa de Ling nos llena de ilusión y ganas de celebrar.", "La emoción crece cuando Ling aparece y nos sorprende una vez más."],
    Orm: ["Qué emoción acompañar a Orm en un momento tan importante y especial.", "Cada nueva etapa de Orm nos llena de ilusión y ganas de celebrar.", "La emoción crece cuando Orm aparece y nos sorprende una vez más."],
    LingOrm: ["La emoción se siente en todas partes cuando LingOrm comparte un nuevo momento.", "Hoy celebramos a LingOrm con la ilusión de vivir otra experiencia inolvidable.", "Cada noticia de LingOrm convierte el día en una celebración especial."],
  },
  Romántico: {
    Ling: ["Ling tiene una forma especial de convertir cada mirada en una historia inolvidable.", "La dulzura de Ling permanece en el corazón mucho después de cada momento.", "Hay una belleza serena en Ling que hace que todo se sienta más especial."],
    Orm: ["Orm tiene una forma especial de convertir cada sonrisa en un recuerdo inolvidable.", "La dulzura de Orm permanece en el corazón mucho después de cada momento.", "Hay una luz especial en Orm que hace que todo se sienta más hermoso."],
    LingOrm: ["Cuando Ling y Orm se miran, hasta el instante más sencillo parece una historia de amor.", "La conexión de LingOrm convierte pequeños momentos en recuerdos que permanecen.", "LingOrm nos recuerda que la complicidad también puede sentirse como poesía."],
  },
  Divertido: {
    Ling: ["Ling aparece y de pronto todos olvidamos que teníamos otros planes para hoy.", "Intentamos mantener la calma, pero Ling vuelve a sorprendernos y el plan fracasa.", "Ling tiene el talento de alegrarnos el día sin siquiera proponérselo."],
    Orm: ["Orm aparece y de pronto todos olvidamos que teníamos otros planes para hoy.", "Intentamos mantener la calma, pero Orm vuelve a sorprendernos y el plan fracasa.", "Orm tiene el talento de alegrarnos el día sin siquiera proponérselo."],
    LingOrm: ["LingOrm aparece y nuestra capacidad de actuar con normalidad desaparece por completo.", "Dijimos que estaríamos tranquilas, pero LingOrm tenía otros planes para nosotras.", "Un momento de LingOrm basta para convertir cualquier día normal en una celebración."],
  },
  Agradecimiento: {
    Ling: ["Gracias, Ling, por compartir tu talento y dedicar tanto cariño a cada proyecto.", "Agradecemos a Ling por inspirarnos con su trabajo, esfuerzo y autenticidad.", "Gracias por tantos momentos especiales, Ling. Seguiremos acompañando cada nueva etapa."],
    Orm: ["Gracias, Orm, por compartir tu talento y dedicar tanto cariño a cada proyecto.", "Agradecemos a Orm por inspirarnos con su trabajo, esfuerzo y autenticidad.", "Gracias por tantos momentos especiales, Orm. Seguiremos acompañando cada nueva etapa."],
    LingOrm: ["Gracias, LingOrm, por compartir momentos que unen y alegran a tantas personas.", "Agradecemos a Ling y Orm por su dedicación, cercanía y todo el cariño que transmiten.", "Gracias por cada recuerdo, LingOrm. Seguiremos acompañando con respeto y mucho cariño."],
  },
};

function countChars(value: string) {
  return twitterText.parseTweet(value).weightedLength;
}

function stripEmoji(value: string) {
  return value
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0E\uFE0F\u200D\u20E3]/gu, "")
    .replace(/[#*0-9](?=\uFE0F?\u20E3)/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function finalText(body: string, keyword: string, hashtags: string[]) {
  const officialBlock = [
    keyword.trim(),
    hashtags.filter(Boolean).map((h) => h.trim().startsWith("#") ? h.trim() : `#${h.trim()}`).join(" "),
  ].filter(Boolean).join("\n");
  return [stripEmoji(body), officialBlock].filter(Boolean).join("\n\n");
}

function normalizedWords(value: string) {
  return new Set(value.split(/\n\s*\n/)[0].toLocaleLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length > 2));
}

function tooSimilar(first: string, second: string) {
  const a = normalizedWords(first); const b = normalizedWords(second);
  if (!a.size || !b.size) return false;
  const shared = [...a].filter((word) => b.has(word)).length;
  return shared / Math.min(a.size, b.size) >= 0.62;
}

function uniqueMessages(candidates: string[], history: string[]) {
  const selected: string[] = [];
  for (const candidate of candidates) {
    if (countChars(candidate) > 280 || history.some((old) => tooSimilar(candidate, old)) || selected.some((old) => tooSimilar(candidate, old))) continue;
    selected.push(candidate);
    if (selected.length === 4) break;
  }
  return selected;
}

export default function Home() {
  return <Suspense fallback={<main><div className="loadingPage">Cargando generador...</div></main>}><Generator /></Suspense>;
}

function Generator() {
  const params = useSearchParams();
  const [keyword, setKeyword] = useState(() => params.get("k") ?? "");
  const [hashtag1, setHashtag1] = useState(() => params.get("h1") ?? "");
  const [hashtag2, setHashtag2] = useState(() => params.get("h2") ?? "");
  const [hashtag3, setHashtag3] = useState(() => params.get("h3") ?? "");
  const [hashtag4, setHashtag4] = useState(() => params.get("h4") ?? "");
  const [context, setContext] = useState(() => params.get("c") ?? "");
  const [language, setLanguage] = useState("Español");
  const [tone, setTone] = useState("Admiración");
  const [protagonist, setProtagonist] = useState("LingOrm");
  const [messages, setMessages] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"gemini" | "backup" | "">("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const locked = Boolean(params.get("h1"));

  const tags = useMemo(() => [hashtag1, hashtag2, hashtag3, hashtag4].filter((x) => x.trim()), [hashtag1, hashtag2, hashtag3, hashtag4]);
  const officialLength = countChars(finalText("", keyword, tags));
  const contextWordCount = context.trim() ? context.trim().split(/\s+/).length : 0;

  function updateContext(value: string) {
    const words = value.trim().split(/\s+/);
    setContext(words.length <= 3000 ? value : words.slice(0, 3000).join(" "));
  }

  function makeShareLink() {
    if (!hashtag1.trim()) {
      setNotice("Completa al menos el hashtag principal antes de crear el enlace."); return;
    }
    const p = new URLSearchParams({ ...(keyword.trim() ? { k: keyword.trim() } : {}), h1: hashtag1.trim(), ...(hashtag2.trim() ? { h2: hashtag2.trim() } : {}), ...(hashtag3.trim() ? { h3: hashtag3.trim() } : {}), ...(hashtag4.trim() ? { h4: hashtag4.trim() } : {}), ...(context.trim() ? { c: context.trim() } : {}) });
    const link = `${window.location.origin}${window.location.pathname}?${p.toString()}`;
    navigator.clipboard.writeText(link);
    setNotice("Enlace para participantes copiado. La llave y los hashtags quedarán bloqueados.");
  }

  function buildFallback() {
    const historyKey = languageHistoryKey(language);
    const history = JSON.parse(localStorage.getItem(historyKey) || "[]") as string[];
    const source = localizedFallback(language, tone, protagonist);
    const varied = source.map((x) => finalText(x, keyword, tags));
    let selected = uniqueMessages(varied, history);
    if (selected.length < 4) selected = uniqueMessages(varied, []);
    localStorage.setItem(historyKey, JSON.stringify([...history, ...selected].slice(-100)));
    return selected;
  }

  function selectLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setMessages([]);
    setGenerationMode("");
    setNotice(`Idioma seleccionado: ${nextLanguage}. Los próximos mensajes se generarán en este idioma.`);
  }

  async function generate() {
    if (!hashtag1.trim()) { setNotice("Debes indicar al menos un hashtag para generar mensajes."); return; }
    setLoading(true); setNotice("");
    try {
      const historyKey = languageHistoryKey(language);
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword, hashtags: tags, context, language, tone, protagonist, history: JSON.parse(localStorage.getItem(historyKey) || "[]").slice(-30) }) });
      const data = await res.json() as { messages?: string[]; mode?: "gemini" | "backup"; duplicateChecks?: boolean; attempts?: number; error?: string };
      if (!res.ok) {
        setNotice(data.error || "No fue posible generar mensajes en este momento.");
        return;
      }
      if (!data.messages) throw new Error("fallback");
      const history = JSON.parse(localStorage.getItem(historyKey) || "[]") as string[];
      const clean = data.messages.map((message) => {
        const terms = [keyword, hashtag1, hashtag2, hashtag3, hashtag4].filter(Boolean);
        const body = terms.reduce((text, term) => text.replaceAll(term, ""), message).trim();
        return finalText(body, keyword, tags);
      });
      const distinct = uniqueMessages(clean, history);
      if (distinct.length < 4) throw new Error("fallback");
      setMessages(distinct);
      setGenerationMode(data.mode || "gemini");
      localStorage.setItem(historyKey, JSON.stringify([...history, ...distinct].slice(-100)));
      if (data.mode === "backup") setNotice("Se activó el modo de respaldo. Los mensajes también fueron revisados para evitar repeticiones.");
      else setNotice(data.attempts && data.attempts > 1 ? "Gemini reemplazó resultados repetitivos antes de mostrarte estos mensajes." : "Cuatro mensajes originales creados y revisados con Gemini.");
    } catch {
      setMessages(buildFallback());
      setGenerationMode("backup");
      setNotice("Se activó el modo de respaldo. Puedes continuar generando y copiando mensajes.");
    } finally { setLoading(false); }
  }

  function copyMessage(message: string, index: number) {
    navigator.clipboard.writeText(message); setNotice(`Mensaje ${index + 1} copiado.`);
  }

  function clearDeviceHistory() {
    languages.forEach((item) => localStorage.removeItem(languageHistoryKey(item)));
    setMessages([]);
    setGenerationMode("");
    setNotice("Se borró el historial guardado solamente en este dispositivo. La protección general contra repeticiones continúa activa.");
  }

  return (
    <main>
      <header className="hero">
        <Image src="/banner-logos.png" alt="Logos de las comunidades LingOrm participantes" className="logoBanner" width={2000} height={700} priority unoptimized />
        <div className="brandTitle"><h1>TODAS UNIDAS X</h1><Image src="/lingorm-wordmark.png" alt="LingOrm" className="wordmark" width={1720} height={890} priority unoptimized /></div>
        <p className="eyebrow">GENERADOR DE MENSAJES PARA TENDENCIAS</p>
        <p className="intro">Crea mensajes claros, diferentes y sin emojis, listos para publicar en X.</p>
      </header>

      <div className="layout">
        <section className="panel setup" aria-labelledby="trend-title">
          <div className="sectionHead"><span className="step">1</span><div><h2 id="trend-title">Datos de la tendencia</h2><p>{locked ? "Configuración oficial bloqueada por el organizador." : "Configura la tendencia una sola vez."}</p></div></div>
          <label>Llave oficial, opcional<input value={keyword} disabled={locked} onChange={(e) => setKeyword(e.target.value)} placeholder="Ej.: LINGORM SPECIAL EVENT" /></label>
          <div className="twoCols">
            <label>Hashtag principal, obligatorio<input value={hashtag1} disabled={locked} onChange={(e) => setHashtag1(e.target.value)} placeholder="#LingOrmSpecialEvent" /></label>
            <label>Segundo hashtag, opcional<input value={hashtag2} disabled={locked} onChange={(e) => setHashtag2(e.target.value)} placeholder="#LingOrm" /></label>
            <label>Tercer hashtag, opcional<input value={hashtag3} disabled={locked} onChange={(e) => setHashtag3(e.target.value)} placeholder="#LingOrmFans" /></label>
            <label>Cuarto hashtag, opcional<input value={hashtag4} disabled={locked} onChange={(e) => setHashtag4(e.target.value)} placeholder="#SupportLingOrm" /></label>
          </div>
          {!locked && <label>Mensaje de inspiración para Gemini<textarea value={context} onChange={(e) => updateContext(e.target.value)} placeholder="Puedes escribir hasta 3.000 palabras con toda la información, detalles y enfoque del evento." rows={9} /><span className="fieldCount">{contextWordCount}/3000 palabras</span></label>}
          <div className="officialCount"><span>Espacio ocupado por llave y hashtags</span><strong>{officialLength}/280</strong></div>
          {!locked && <button className="secondary" onClick={makeShareLink}>Crear y copiar enlace para participantes</button>}
        </section>

        <section className="panel choices" aria-labelledby="style-title">
          <div className="sectionHead"><span className="step">2</span><div><h2 id="style-title">Elige el estilo</h2><p>Personaliza los cuatro mensajes.</p></div></div>
          <fieldset><legend>Idioma</legend><div className="segmented three">{languages.map((x, index) => <button key={x} type="button" className={`color-${index + 1} ${language === x ? "active" : ""}`} aria-pressed={language === x} onClick={() => selectLanguage(x)}>{x}</button>)}</div></fieldset>
          <fieldset><legend>Protagonista</legend><div className="segmented three">{protagonists.map((x, index) => <button key={x} className={`color-${index + 2} ${protagonist === x ? "active" : ""}`} aria-pressed={protagonist === x} onClick={() => setProtagonist(x)}>{x}</button>)}</div></fieldset>
          <fieldset><legend>Tono</legend><div className="toneGrid">{tones.map((x, index) => <button key={x} className={`color-${index + 1} ${tone === x ? "active" : ""}`} aria-pressed={tone === x} onClick={() => setTone(x)}>{x}</button>)}</div></fieldset>
          <button className="primary" onClick={generate} disabled={loading}>{loading ? "Creando mensajes..." : messages.length ? "Generar otros 4 mensajes" : "Generar 4 mensajes"}</button>
          <button className="historyButton" type="button" onClick={clearDeviceHistory}>Borrar historial de este dispositivo</button>
        </section>
      </div>

      {notice && <div className="notice" role="status">{notice}</div>}

      {generationMode && <div className={`modeBadge ${generationMode}`} role="status">{generationMode === "gemini" ? "Generado con Gemini y control antirrepetición" : "Modo de respaldo con control antirrepetición"}</div>}

      <section className="results" aria-live="polite">
        {messages.map((message, index) => {
          const length = countChars(message);
          return <article className="messageCard" key={`${message}-${index}`}><div className="messageTop"><span>Mensaje {index + 1}</span><span className={length > 280 ? "count danger" : length > 240 ? "count warning" : "count"}>{length}/280</span></div><p>{message}</p><div className="cardActions"><button onClick={() => copyMessage(message, index)}>Copiar mensaje</button></div></article>;
        })}
      </section>
      <footer>Los mensajes se generan sin emojis. Revisa siempre el contenido antes de publicarlo.</footer>
    </main>
  );
}

function localizedFallback(language: string, tone: string, protagonist: string) {
  if (language === "Português") {
    const name = protagonist === "Ling" ? "Lingling Kwong" : protagonist === "Orm" ? "Orm Kornnaphat" : "Ling e Orm";
    const transforms = protagonist === "LingOrm" ? "transformam" : "transforma";
    const shares = protagonist === "LingOrm" ? "compartilham" : "compartilha";
    return [`${name} ${transforms} cada aparição em um momento especial que merece ser celebrado.`, `Hoje unimos nossas vozes para reconhecer o talento, a dedicação e o trabalho de ${name}.`, `A presença de ${name} traz uma energia única e deixa lembranças inesquecíveis.`, `Seguimos acompanhando cada conquista de ${name} com respeito, carinho e entusiasmo.`, `Este evento é mais uma oportunidade para celebrar tudo o que ${name} ${shares} com o público.`, `A autenticidade de ${name} inspira pessoas de diferentes lugares a participarem desta tendência.`, `Cada novo projeto revela uma faceta especial de ${name} e aumenta nossa admiração.`, `Nosso apoio a ${name} continua firme, positivo e cheio de bons desejos.`];
  }
  if (language === "English") {
    const name = protagonist === "Ling" ? "Lingling Kwong" : protagonist === "Orm" ? "Orm Kornnaphat" : "Ling and Orm";
    const turns = protagonist === "LingOrm" ? "turn" : "turns";
    const shares = protagonist === "LingOrm" ? "share" : "shares";
    return [`${name} ${turns} every appearance into a special moment worth celebrating.`, `Today we unite our voices to recognize the talent, dedication, and work of ${name}.`, `The presence of ${name} brings unique energy and creates unforgettable memories.`, `We continue supporting every achievement of ${name} with respect and enthusiasm.`, `This event gives us another opportunity to celebrate everything ${name} ${shares} with the audience.`, `The authenticity of ${name} inspires people from many places to join this trend.`, `Each new project reveals something special about ${name} and strengthens our admiration.`, `Our support for ${name} remains positive, sincere, and full of good wishes.`];
  }
  const source = fallback[tone]?.[protagonist] ?? fallback.Admiración.LingOrm;
  const name = protagonist === "Ling" ? "Lingling Kwong" : protagonist === "Orm" ? "Orm Kornnaphat" : "Ling y Orm";
  return [...source, `Hoy celebramos el camino de ${name} y todo el esfuerzo que existe detrás de cada logro.`, `Esta tendencia reúne a personas de distintos lugares para acompañar a ${name} con respeto.`, `Cada proyecto de ${name} ofrece una nueva razón para reconocer su dedicación y crecimiento.`, `La autenticidad de ${name} convierte este evento en una ocasión realmente significativa.`, `Nuestro apoyo a ${name} permanece firme, positivo y lleno de buenos deseos.`];
}
