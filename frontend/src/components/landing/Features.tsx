import { Bot, FileText, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: <Bot size={32} />,
    title: "AI-Powered Chat",
    desc: "Instant customer support powered by Retrieval-Augmented Generation.",
  },
  {
    icon: <FileText size={32} />,
    title: "Knowledge Base",
    desc: "Searches uploaded company documents instead of the internet.",
  },
  {
    icon: <ShieldCheck size={32} />,
    title: "Human Review",
    desc: "Low-confidence responses are automatically flagged for admins.",
  },
  {
    icon: <BarChart3 size={32} />,
    title: "Analytics",
    desc: "Track conversations, satisfaction, confidence and knowledge gaps.",
  },
];

function Features() {
  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 px-6 md:px-10 pb-16 md:pb-20">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="
            group
            flex
            flex-col
            justify-start
            h-full
            bg-slate-900
            rounded-2xl
            p-5 md:p-6
            border
            border-slate-800
            transition-all
            duration-300
            hover:-translate-y-2
            hover:border-cyan-500
            hover:shadow-xl
            hover:shadow-cyan-500/20
            cursor-pointer
          "
        >
          <div
            className="
              text-cyan-400
              mb-4
              transition-all
              duration-300
              group-hover:scale-110
              group-hover:rotate-6
            "
          >
            {feature.icon}
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-white">
            {feature.title}
          </h3>

          <p className="mt-3 text-sm md:text-base leading-7 text-slate-400">
            {feature.desc}
          </p>
        </div>
      ))}
    </section>
  );
}

export default Features;