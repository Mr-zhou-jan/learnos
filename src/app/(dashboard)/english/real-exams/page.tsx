"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, FileText, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

const REAL_EXAMS: Record<string, { year: number; month: number; label: string; sets: { name: string; writing: string; translation: { cn: string; en: string } }[] }> = {
  "2025-06": { year: 2025, month: 6, label: "2025年6月", sets: [
    { name: "第一套", writing: "Directions: Suppose your university is seeking students' opinions on the necessity of making College Chinese a compulsory course. You are to write an essay to express your view. Write at least 120 words but no more than 180 words.",
      translation: { cn: "被誉为‘杂交水稻之父’的袁隆平和他的科研团队克服重重困难，研发出了一种超级杂交水稻。这项技术获得了举世公认的巨大成功。通过这项技术的应用，水稻抗旱抗病能力更强，能适应不同的气候和土壤条件，产量可提高20%-30%。超级杂交水稻营养丰富，口感更佳。目前已在许多国家得到广泛应用，为全球粮食安全做出了重大贡献。", en: "Yuan Longping, known as the 'Father of Hybrid Rice,' and his research team overcame numerous difficulties to develop super hybrid rice. This technology has achieved globally recognized success. Through its application, rice has stronger drought and disease resistance, adapting to different climate and soil conditions, with yield increases of 20%-30%. Super hybrid rice is nutritious and tastes better. It has been widely applied in many countries, contributing significantly to global food security." } },
    { name: "第二套", writing: "Directions: Suppose your university is conducting a survey to collect students' opinions on the appropriate use of AI technology in assisting learning. You are to write an essay. Write at least 120 words but no more than 180 words.",
      translation: { cn: "近年来，中国东北地区正在大力发展冰雪资源。哈尔滨利用丰富的冰雪资源，打造了独具特色的冰雪大世界，让游客在欣赏冰雪之美的同时也能体验当地独特的民俗文化。如今，曾经令人畏惧的冰天雪地正吸引着四面八方的游客，成为了深受欢迎的旅游胜地。", en: "In recent years, northeast China has been vigorously developing ice-snow resources. Harbin has built the unique Ice and Snow World using rich ice-snow resources, allowing tourists to appreciate the beauty of ice and snow while experiencing local folk culture. The once daunting ice and snow are now attracting tourists from all directions, becoming a popular tourist destination." } },
    { name: "第三套", writing: "Directions: Suppose your university is organizing a forum on the development of students' cross-cultural communication abilities. Write an essay. Write at least 120 words but no more than 180 words.",
      translation: { cn: "近年来，中国越来越多的城市致力打造‘15分钟便民生活圈’。居民可以在15分钟步行范围内获得公共服务。便民生活圈配备便利店、公园、健身设施、图书馆、学校、社区食堂和诊所等。建立这样的生活圈有助于为居民提供更便捷、舒适的生活环境，提高生活质量和幸福感。", en: "In recent years, more Chinese cities have been building '15-minute convenient living circles'. Residents can access public services within a 15-minute walk. Such circles have convenience stores, parks, fitness facilities, libraries, schools, community canteens, and clinics, providing a more convenient and comfortable living environment while improving quality of life and happiness." } },
  ]},
  "2024-12": { year: 2024, month: 12, label: "2024年12月", sets: [
    { name: "第一套", writing: "Directions: Suppose the university newspaper is inviting submissions on how to enrich students' knowledge of traditional Chinese culture. Write an essay. Write at least 120 words but no more than 180 words.",
      translation: { cn: "中国书法是中国传统文化的重要组成部分，已有数千年历史。书法不仅是一种书写方式，更是一种艺术形式，体现了中国人的审美观念和哲学思想。学习书法可以培养耐心和专注力，提高审美能力。许多学校已将书法纳入课程体系。", en: "Chinese calligraphy is an important part of traditional Chinese culture with a history of thousands of years. It is not only a writing method but also an art form reflecting Chinese aesthetic concepts and philosophical thoughts. Learning calligraphy cultivates patience and concentration while improving aesthetic ability. Many schools have incorporated calligraphy into their curriculum." } },
    { name: "第二套", writing: "Directions: Suppose your university is organizing a campaign to promote environmental protection on campus. Write a proposal. Write at least 120 words but no more than 180 words.",
      translation: { cn: "太极拳起源于中国古代，是一种集健身、防身和修身于一体的传统武术。太极拳动作缓慢柔和，适合各年龄段练习。如今已传播到世界各地，深受各国人民喜爱。练习太极拳不仅能增强体质，还能减轻压力、保持内心平静。", en: "Tai Chi, originating from ancient China, is a traditional martial art integrating fitness, self-defense, and self-cultivation. Its slow, gentle movements suit all ages. Today it has spread worldwide. Practicing Tai Chi strengthens the body, reduces stress, and maintains inner peace." } },
    { name: "第三套", writing: "Directions: Write an essay on the impact of social media on interpersonal communication. Analyze both positive and negative effects. Write at least 120 words but no more than 180 words.",
      translation: { cn: "中国结是中国传统手工艺品，由一根丝线编织而成，造型优美，寓意吉祥。最初用于记录事件，后演变为装饰品和礼物。春节期间，人们常在家中悬挂中国结，象征团圆、幸福和好运。", en: "The Chinese knot is a traditional Chinese handicraft woven from a single silk thread, with elegant shapes and auspicious meanings. Originally used to record events, it evolved into decorations and gifts. During Spring Festival, people hang Chinese knots symbolizing reunion, happiness, and good luck." } },
  ]},
  "2024-06": { year: 2024, month: 6, label: "2024年6月", sets: [
    { name: "第一套", writing: "Directions: Suppose your university is holding a reading festival. Write a notice to publicize the event. Write at least 120 words but no more than 180 words.",
      translation: { cn: "近年来，中国的高铁网络发展迅速，已成为世界上规模最大的高铁系统。高铁不仅大大缩短了城市间的旅行时间，还促进了区域经济发展和人员流动。中国高铁以其安全性、准时性和舒适性赢得了广泛赞誉。", en: "China's high-speed rail network has developed rapidly, becoming the world's largest. It has greatly shortened travel time between cities while promoting regional economic development and population mobility. China's high-speed rail has won wide praise for its safety, punctuality, and comfort." } },
    { name: "第二套", writing: "Directions: Write an essay on the importance of developing good learning habits in college. Write at least 120 words but no more than 180 words.",
      translation: { cn: "共享经济在中国发展迅速，从共享单车到共享充电宝，共享理念已深入日常生活。这种模式节约了资源，为人们提供了便利。然而也面临管理挑战，需要政府和企业共同努力建立规范的市场秩序。", en: "The sharing economy has developed rapidly in China, from shared bicycles to shared power banks. This concept has penetrated daily life, saving resources and providing convenience. However, it also faces management challenges, requiring joint government and enterprise efforts to establish orderly markets." } },
    { name: "第三套", writing: "Directions: Write an essay on how to maintain a healthy lifestyle while in college. Write at least 120 words but no more than 180 words.",
      translation: { cn: "中医药是中华民族的瑰宝，已有数千年历史。它以整体观念和辨证论治为核心，强调人体与自然的和谐统一。2015年，屠呦呦因发现青蒿素获得诺贝尔奖，进一步推动了中医药的国际化进程。", en: "Traditional Chinese Medicine is a treasure of the Chinese nation with thousands of years of history. Centered on holistic concepts and syndrome differentiation, it emphasizes harmony between body and nature. In 2015, Tu Youyou won the Nobel Prize for discovering artemisinin, further advancing TCM's globalization." } },
  ]},
  "2023-12": { year: 2023, month: 12, label: "2023年12月", sets: [
    { name: "第一套", writing: "Directions: Suppose your university is conducting a survey on students' satisfaction with campus services. Write a letter to the university newspaper expressing your view. Write at least 120 words but no more than 180 words.",
      translation: { cn: "中国茶文化源远流长，已有数千年历史。茶不仅是一种饮品，更是中国人生活方式的重要组成部分。各地形成了不同的饮茶习俗，如广东的早茶、福建的功夫茶。茶文化强调和谐、宁静、愉悦和真诚的精神。", en: "Chinese tea culture has a long history of thousands of years. Tea is not just a beverage but an important part of Chinese lifestyle. Different regions have formed unique tea-drinking customs, such as Cantonese morning tea and Fujian Gongfu tea. Tea culture emphasizes the spirit of harmony, tranquility, enjoyment, and authenticity." } },
    { name: "第二套", writing: "Directions: Write an essay on the role of teamwork in achieving success. Use examples to support your view. Write at least 120 words but no more than 180 words.",
      translation: { cn: "移动支付在中国已经普及，从大型商场到街边小摊，扫码支付已成为人们习以为常的支付方式。移动支付不仅方便快捷，还推动了无现金社会的发展。中国的移动支付技术和模式已开始向海外输出。", en: "Mobile payment has become widespread in China. From large shopping malls to street vendors, QR code payment has become a common payment method. Mobile payment is not only convenient and fast but also promotes the development of a cashless society. China's mobile payment technology and models have begun to expand overseas." } },
    { name: "第三套", writing: "Directions: Write an essay on whether college students should take part-time jobs. Discuss advantages and disadvantages. Write at least 120 words but no more than 180 words.",
      translation: { cn: "近年来，中国的城市化进程不断加快，越来越多的人从农村迁往城市生活。城市化带来了经济繁荣和生活便利，但也面临交通拥堵、环境污染等挑战。政府正采取措施推动可持续城市化发展。", en: "In recent years, China's urbanization has been accelerating, with more people moving from rural areas to cities. Urbanization has brought economic prosperity and living convenience, but also challenges such as traffic congestion and environmental pollution. The government is taking measures to promote sustainable urbanization." } },
  ]},
};

export default function RealExamsPage() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const examKeys = Object.keys(REAL_EXAMS).sort((a,b) => b.localeCompare(a));
  const exam = selectedExam ? REAL_EXAMS[selectedExam] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={()=>router.push("/english/exam")} className="text-sm text-zinc-500 flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4"/>返回整卷练习</button>
      <div className="flex items-center gap-3 mb-6"><History className="w-8 h-8 text-amber-500"/><div><h1 className="text-2xl font-bold">真题汇总</h1><p className="text-zinc-500 text-sm">真实四六级真题 · 写作翻译为真实题目 · 听力阅读AI辅助生成</p></div></div>

      {!selectedExam ? (
        <div className="space-y-3">
          {examKeys.map(key => { const ex = REAL_EXAMS[key]; return (
            <button key={key} onClick={()=>setSelectedExam(key)} className="card p-5 w-full text-left hover:shadow hover:border-primary-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><FileText className="w-6 h-6 text-amber-500"/></div>
                <div><h3 className="font-bold text-lg">{ex.label}</h3><p className="text-sm text-zinc-500">{ex.sets.length}套真题 · 真实写作翻译 + AI听力阅读</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-primary-500"/>
            </button>
          );})}
        </div>
      ) : (
        <div>
          <button onClick={()=>setSelectedExam(null)} className="text-sm text-zinc-500 flex items-center gap-1 mb-4"><ArrowLeft className="w-3 h-3"/>返回年份</button>
          <h2 className="font-bold text-lg mb-4">{exam!.label} 真题</h2>
          <div className="space-y-3">
            {exam!.sets.map((s,i)=>(
              <div key={i} className="card p-5">
                <h3 className="font-bold mb-3">{s.name}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-2 bg-zinc-50 rounded"><span className="font-medium text-primary-600">✍️ 写作</span><p className="text-zinc-500 mt-0.5 line-clamp-2">{s.writing.slice(0,80)}...</p></div>
                  <div className="p-2 bg-zinc-50 rounded"><span className="font-medium text-primary-600">🌐 翻译</span><p className="text-zinc-500 mt-0.5 line-clamp-2">{s.translation.cn.slice(0,60)}...</p></div>
                </div>
                <button onClick={()=>{
                  localStorage.setItem("learnos_real_exam_data", JSON.stringify({ year:exam!.year,month:exam!.month,setIndex:i,writing:s.writing,translation:s.translation }));
                  router.push(`/english/exam?real=1&set=${i}`);
                }} className="btn-primary w-full text-sm flex items-center justify-center gap-2"><Clock className="w-4 h-4"/>开始答题（130分钟）</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
