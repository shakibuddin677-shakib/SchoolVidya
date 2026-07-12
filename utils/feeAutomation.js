import FeeStructure from "../models/feeStructure.model.js";
import Class from "../models/class.model.js";

// "YYYY-MM" format mein CURRENT month (jaise "2026-07")
function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// "2026-07" -> "2026-08" (agla month)
function addOneMonth(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m, 1); // m already 1-indexed value ka "next month" index bin jaata hai
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// FEATURE: "Tuition Fee" month-wise hai - jaise hi ek month poora ho jaata
// hai, agle month ka Tuition Fee structure AUTOMATICALLY (khud) ban jaana
// chahiye, Admin ko manually "Add Fee Structure" karne ki zaroorat nahi.
//
// Yeh function har Class ke liye check karta hai: "iska sabse RECENT
// (latest) monthly Tuition Fee structure kis month ka hai?" - agar wo
// CURRENT month se peeche hai, to beech ke saare missing months ke liye
// (agar server kai din/mahine band raha ho to bhi) naye structures create
// kar deta hai, purane structure jaisa hi amount/due-day use karke.
//
// Kahan se call hota hai (SIMPLE design - koi background job/cron/interval
// nahi, sirf "on-visit" catch-up):
// Admin jab bhi Fee Structures / Fee Collection Report / kisi student ka
// Fee Status dekhta hai, wahan yeh function call hota hai. Real usage mein
// Admin har mahine kam se kam ek baar zaroor Fee section kholta hai,
// isliye alag se cron/setInterval chalane ki zaroorat nahi padi - kam code,
// kam moving parts, aur multi-instance server pe duplicate interval chalne
// ka risk bhi nahi.
export const ensureCurrentMonthTuitionFees = async () => {
  const thisMonth = currentMonthStr();

  const classes = await Class.find().select("_id");

  for (const cls of classes) {
    // Is class ka sabse RECENT month-wise Tuition Fee structure dhoondo
    const latest = await FeeStructure.findOne({
      classId: cls._id,
      feeType: "Tuition Fee",
      billingType: "month",
    }).sort({ month: -1 });

    // Is class ke liye Tuition Fee kabhi month-wise set hi nahi hua - isko
    // chhod do, Admin ko pehli baar manually "Add Fee Structure" karni hogi
    if (!latest || !latest.month) continue;

    if (latest.month >= thisMonth) continue; // already up to date

    let nextMonth = addOneMonth(latest.month);
    const { amount } = latest;
    const dueDay = latest.dueDate ? new Date(latest.dueDate).getDate() : 10;

    let safety = 0; // infinite loop se bachne ke liye (max 24 months ek baar mein)
    while (nextMonth <= thisMonth && safety < 24) {
      try {
        await FeeStructure.create({
          classId: cls._id,
          feeType: "Tuition Fee",
          billingType: "month",
          month: nextMonth,
          term: "",
          amount,
          dueDate: new Date(`${nextMonth}-${String(dueDay).padStart(2, "0")}`),
        });
      } catch (err) {
        // Duplicate key (11000) matlab yeh already ban chuka hai (race
        // condition - jaise startup aur admin ka page load ek saath ho
        // gaya) - ise ignore karo, baaki errors upar throw karo
        if (err.code !== 11000) throw err;
      }
      nextMonth = addOneMonth(nextMonth);
      safety++;
    }
  }
};
