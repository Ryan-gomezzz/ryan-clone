import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft } from "lucide-react";
import { fetchProject } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await fetchProject(params.slug);
  if (!project) notFound();

  return (
    <div className="min-h-screen px-6 md:px-10 pt-32 md:pt-40 pb-20 max-w-3xl mx-auto">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-fg-muted hover:text-accent transition-colors mb-12"
      >
        <ArrowLeft className="w-3 h-3" />
        all work
      </Link>

      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-4">
          {project.status} · {project.type}
        </p>
        <h1 className="font-editorial-tight text-4xl md:text-6xl">
          {project.title}
        </h1>
      </header>

      <article className="message-prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {project.content}
        </ReactMarkdown>
      </article>

      <div className="thin-divider mt-20 mb-10" />
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-fg-muted">
        questions on this project?{" "}
        <Link href="/" className="text-accent hover:underline">
          ask the clone →
        </Link>
      </p>
    </div>
  );
}
