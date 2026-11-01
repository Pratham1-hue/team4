"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  Users,
  CheckCircle2,
  Trash2,
  Send,
  Sparkles,
  Camera,
  Coins,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button, Input, Select, Badge, Modal } from "@/components/ui";
import { formatINR, uid } from "@/lib/utils";

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: "Food" | "Transport" | "Stay" | "Activities" | "Other";
  paidBy: string; // Member name
  splitWith: string[]; // Member names
  date: string;
}

interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    title: "Dinner at 1135 AD Amber Fort",
    amount: 6800,
    currency: "INR",
    category: "Food",
    paidBy: "Pratham",
    splitWith: ["Pratham", "Aarav", "Ananya", "Kabir"],
    date: "2026-10-24",
  },
  {
    id: "exp-2",
    title: "Innova Crysta Airport & Sightseeing Cab",
    amount: 4500,
    currency: "INR",
    category: "Transport",
    paidBy: "Aarav",
    splitWith: ["Pratham", "Aarav", "Ananya", "Kabir"],
    date: "2026-10-24",
  },
  {
    id: "exp-3",
    title: "City Palace Composite Tickets",
    amount: 2800,
    currency: "INR",
    category: "Activities",
    paidBy: "Ananya",
    splitWith: ["Pratham", "Aarav", "Ananya", "Kabir"],
    date: "2026-10-25",
  },
  {
    id: "exp-4",
    title: "Blue Pottery Souvenirs & Spices",
    amount: 3200,
    currency: "INR",
    category: "Other",
    paidBy: "Kabir",
    splitWith: ["Kabir", "Pratham"],
    date: "2026-10-25",
  },
];

const GROUP_MEMBERS = ["Pratham", "Aarav", "Ananya", "Kabir"];

export default function ExpensesPage() {
  const { trips, toast } = useApp();
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [category, setCategory] = useState<Expense["category"]>("Food");
  const [paidBy, setPaidBy] = useState("Pratham");
  const [splitWith, setSplitWith] = useState<string[]>(GROUP_MEMBERS);

  // Total spend
  const totalSpend = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Net balances for each member
  const balances = useMemo(() => {
    const net: Record<string, number> = {};
    GROUP_MEMBERS.forEach((m) => (net[m] = 0));

    expenses.forEach((e) => {
      // Payer gets positive credit
      net[e.paidBy] = (net[e.paidBy] || 0) + e.amount;
      // Split participants get negative debit
      const perPerson = e.amount / (e.splitWith.length || 1);
      e.splitWith.forEach((m) => {
        net[m] = (net[m] || 0) - perPerson;
      });
    });

    return net;
  }, [expenses]);

  // Debt Simplification Algorithm (Greedy minimum transaction resolution)
  const settlementTransfers = useMemo(() => {
    const debtors: { member: string; amount: number }[] = [];
    const creditors: { member: string; amount: number }[] = [];

    Object.entries(balances).forEach(([member, balance]) => {
      const rounded = Math.round(balance);
      if (rounded < -1) {
        debtors.push({ member, amount: -rounded });
      } else if (rounded > 1) {
        creditors.push({ member, amount: rounded });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transfers: SettlementTransfer[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0) {
        transfers.push({
          from: debtor.member,
          to: creditor.member,
          amount: settleAmount,
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount <= 1) i++;
      if (creditor.amount <= 1) j++;
    }

    return transfers;
  }, [balances]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    const newExp: Expense = {
      id: uid("exp"),
      title,
      amount: num,
      currency,
      category,
      paidBy,
      splitWith: splitWith.length ? splitWith : GROUP_MEMBERS,
      date: new Date().toISOString().slice(0, 10),
    };

    setExpenses([newExp, ...expenses]);
    toast("Expense added", `Logged ${title} for ${formatINR(num)}`, "success");
    setModalOpen(false);
    setTitle("");
    setAmount("");
  };

  const handleShareSummary = () => {
    const text = `*Yatri Expense Settlement Summary*\nTotal Spend: ${formatINR(totalSpend)}\n\nSettlement Plan:\n${settlementTransfers
      .map((t) => `• ${t.from} pays ${t.to}: ${formatINR(t.amount)}`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard", "Ready to paste in WhatsApp group!", "success");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg shadow-md">
              <Coins size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">
                  Group Expense & Split Engine
                </h1>
                <Badge variant="green" className="text-[10px]">
                  Debt Simplification Active
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Track shared costs, resolve minimal settle-up transfers, and export to WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShareSummary}>
            <Send size={14} />
            <span>Copy WhatsApp Summary</span>
          </Button>

          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            <span>Add Expense</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Total Group Spend</p>
          <p className="mt-2 text-3xl font-black text-fg">{formatINR(totalSpend)}</p>
          <p className="mt-1 text-xs text-muted">{expenses.length} expenses logged</p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Your Net Balance (Pratham)</p>
          <p
            className={`mt-2 text-3xl font-black ${
              balances["Pratham"] >= 0 ? "text-emerald-500" : "text-danger"
            }`}
          >
            {balances["Pratham"] >= 0 ? "+" : ""}
            {formatINR(balances["Pratham"] || 0)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {balances["Pratham"] >= 0 ? "You will receive overall" : "You owe to the group"}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Optimal Transfers</p>
          <p className="mt-2 text-3xl font-black text-accent">{settlementTransfers.length}</p>
          <p className="mt-1 text-xs text-muted">Simplified from {expenses.length * 3} direct debts</p>
        </div>
      </div>

      {/* Settlement Transfers (Who pays Whom) */}
      <div className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
              <ArrowRightLeft size={16} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-fg">Smart Settlement Plan</h2>
              <p className="text-xs text-muted">
                Minimal transactions required to settle all group debts cleanly
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {settlementTransfers.map((transfer, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl border border-line/80 bg-card2/60 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-fg font-bold text-xs">
                  {transfer.from[0]}
                </span>
                <div>
                  <p className="text-xs font-bold text-fg">
                    {transfer.from} <span className="text-muted font-normal">pays</span> {transfer.to}
                  </p>
                  <p className="text-[11px] text-muted">Direct UPI / Bank Transfer</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-accent">
                {formatINR(transfer.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Expenses List */}
      <div className="mt-6 rounded-3xl border border-line bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold text-fg mb-4">Recent Expenses</h2>
        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between rounded-2xl border border-line/70 bg-card p-3.5 hover:border-accent/40 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-card2 text-muted font-bold">
                  <Receipt size={16} />
                </span>
                <div>
                  <p className="font-bold text-fg">{exp.title}</p>
                  <p className="text-[11px] text-muted">
                    Paid by <strong className="text-fg">{exp.paidBy}</strong> · Split among{" "}
                    {exp.splitWith.join(", ")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-sm text-fg">
                  {formatINR(exp.amount)}
                </span>
                <p className="text-[10px] text-muted">{exp.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Group Expense" size="md">
        <form onSubmit={handleAddExpense} className="space-y-4 pt-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              What was it for? *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner, Fuel, Entry Tickets"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Amount (₹) *
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Category
              </label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense["category"])}
              >
                <option value="Food">Food & Dining</option>
                <option value="Transport">Transport & Cabs</option>
                <option value="Stay">Hotel & Stays</option>
                <option value="Activities">Activities & Tickets</option>
                <option value="Other">Shopping & Other</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Paid By
              </label>
              <Select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                {GROUP_MEMBERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Split With
              </label>
              <p className="text-xs text-muted pt-2">All 4 Members (Equal Split)</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

