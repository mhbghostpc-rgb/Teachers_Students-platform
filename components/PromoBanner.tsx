'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaTimes, FaInfoCircle, FaCheckCircle, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';

function CountdownTimer({ onEnd }: { onEnd: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const envDate = process.env.NEXT_PUBLIC_PROMO_END_DATE;
    const targetDate = new Date(envDate || '2026-07-22T23:59:59Z').getTime();
    let ended = false;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!ended) {
          ended = true;
          onEnd();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 font-bold text-slate-900 text-base md:text-lg dir-ltr font-mono" dir="ltr">
      <span>{timeLeft.days}d</span> : 
      <span>{timeLeft.hours.toString().padStart(2, '0')}h</span> : 
      <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span> : 
      <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
    </div>
  );
}

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnded, setIsEnded] = useState(false);

  useEffect(() => {
    // Check initial state
    const envDate = process.env.NEXT_PUBLIC_PROMO_END_DATE;
    const targetDate = new Date(envDate || '2026-07-22T23:59:59Z').getTime();
    if (new Date().getTime() >= targetDate) {
      setIsVisible(false);
      setIsEnded(true);
    }
  }, []);

  const handleEnd = async () => {
    setIsVisible(false);
    setIsModalOpen(false);
    if (!isEnded) {
      setIsEnded(true);
      try {
        await fetch('/api/admin/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'انتهاء العرض الترويجي ⏰',
            message: 'لقد انتهى وقت العرض الترويجي المجاني المحدد مسبقاً، وتم إخفاء البانر الإعلاني من الموقع تلقائياً بنجاح.',
            type: 'warning'
          })
        });
      } catch (err) {
        console.error('Failed to send alert', err);
      }
    }
  };

  if (!isVisible || isEnded) return null;

  return (
    <>
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-slate-900 relative z-[60] shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 text-sm md:text-base font-medium relative z-10">
          
          <div className="flex items-center gap-2 text-center md:text-right">
            <span className="font-bold">✨ سارع باقتناء الفرصة المجانية تماماً في إنشاء حسابك!</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2 bg-slate-900/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <FaClock className="animate-pulse" />
              <span>ينتهي التسجيل المجاني بعد:</span>
              <CountdownTimer onEnd={handleEnd} />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 bg-slate-900 text-yellow-400 hover:text-yellow-300 px-3 py-1 rounded-full transition-colors text-sm font-bold shadow-md hover:shadow-lg"
            >
              <FaInfoCircle /> التفاصيل والمميزات
            </button>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="text-slate-900 hover:text-white transition-colors p-1"
              aria-label="إغلاق"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border-2 border-yellow-500 rounded-2xl p-6 md:p-8 max-w-2xl w-full text-white shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 left-4 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2">
                  مميزات التسجيل المجاني
                </h2>
                <p className="text-gray-300">
                  فرصة ذهبية للطلاب والمعلمين للانضمام إلى منصتنا مجاناً بالكامل
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Students Features */}
                <div className="bg-slate-800/50 p-5 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-4 text-yellow-400">
                    <FaUserGraduate size={24} />
                    <h3 className="text-xl font-bold">بالنسبة للطالب</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">إمكانية البحث عن المدرسين بشكل مجاني تماماً.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">الحجز المباشر للدروس من خلال المنصة بسهولة.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">ترقبوا كوبونات خصم حصرية للطلبة المتميزين.</span>
                    </li>
                  </ul>
                </div>

                {/* Teachers Features */}
                <div className="bg-slate-800/50 p-5 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-4 text-yellow-400">
                    <FaChalkboardTeacher size={24} />
                    <h3 className="text-xl font-bold">بالنسبة للمعلم</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">المنصة تدعم التفاعل الكامل بين الطالب وولي الأمر في إيجاد المعلم المتميز.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">تسجيل مجاني تماماً للوصول السلس للطلاب عبر الواتساب أو الهاتف.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">عرض صفحتك الشخصية بشكل أنيق واحترافي.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FaCheckCircle className="text-yellow-500 mt-1 shrink-0" />
                      <span className="text-gray-200">كوبونات خصم للمدرسين المتميزين على المنصة.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center bg-yellow-600/10 p-4 rounded-xl border border-yellow-500/30">
                <p className="text-yellow-300 font-bold text-lg mb-2">
                  ⏳ يرجى العلم أنه بعد انتهاء هذا الأسبوع، سيصبح التسجيل غير مجاني وسيستغرق وقتاً أطول للموافقة!
                </p>
                <p className="text-gray-300 text-sm md:text-base">
                  لذلك سارع بالتسجيل الآن إن كنت طالباً أو معلماً لتحصل على كافة المميزات المجانية بالكامل قبل انتهاء المهلة.
                </p>
                <div className="mt-4 flex justify-center gap-4">
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      window.location.href = '/register';
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-slate-900 font-bold px-6 py-2 rounded-lg transition-colors"
                  >
                    سجل الآن
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
