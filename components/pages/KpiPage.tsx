"use client";

import { LucidePackageCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import {
  FaBolt,
  FaCalendarDays,
  FaCertificate,
  FaChevronLeft,
  FaChevronRight,
  FaCircleCheck,
} from "react-icons/fa6";
import { FaMinusCircle, FaPlusCircle } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { BsPencilSquare } from "react-icons/bs";
import { HiDocumentReport, HiTrendingUp } from "react-icons/hi";
import { GoAlertFill } from "react-icons/go";
import { RiHospitalFill } from "react-icons/ri";
import { FcFullTrash } from "react-icons/fc";
// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiProduct {
  _id: string;
  name: string;
  points: number;
  active: boolean;
}

interface KpiProductEntry {
  productId: KpiProduct | string;
  achieved: boolean;
}

interface SalesBreakdown {
  institutional: number;
  distributor: number;
  direct: number;
}

interface KpiRecord {
  _id?: string;
  month: number;
  year: number;
  salesTarget: number;
  // ── computed live from sale models (read-only on this page) ──
  actualSales: number;
  salesBreakdown: SalesBreakdown;
  institutionalVisits: number;
  // ── manually entered ──
  cmePr: number;
  cmePrTarget: number;
  dailyReports: number;
  dailyReportsTarget: number;
  productEntries: KpiProductEntry[];
}

interface KpiScores {
  salesScore: number;
  productScore: number;
  institutionalScore: number;
  cmePrScore: number;
  dailyReportScore: number;
  total: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function emptyRecord(month: number, year: number): KpiRecord {
  return {
    month,
    year,
    salesTarget: 0,
    actualSales: 0,
    salesBreakdown: { institutional: 0, distributor: 0, direct: 0 },
    institutionalVisits: 0,
    cmePr: 0,
    cmePrTarget: 2,
    dailyReports: 0,
    dailyReportsTarget: 20,
    productEntries: [],
  };
}

// ─── KPI Calculation ──────────────────────────────────────────────────────────

function calculateKPI(record: KpiRecord, products: KpiProduct[]): KpiScores {
  const salesScore =
    record.salesTarget > 0 ? (record.actualSales / record.salesTarget) * 60 : 0;

  const achievedIds = new Set(
    record.productEntries
      .filter((e) => e.achieved)
      .map((e) =>
        typeof e.productId === "string" ? e.productId : e.productId._id,
      ),
  );

  const productScore = products
    .filter((p) => p.active && achievedIds.has(p._id))
    .reduce((sum, p) => sum + p.points, 0);

  const institutionalScore = Math.min(record.institutionalVisits, 2) * 2.5;
  const cmePrTarget = record.cmePrTarget > 0 ? record.cmePrTarget : 2;
  const dailyTarget =
    record.dailyReportsTarget > 0 ? record.dailyReportsTarget : 20;
  const cmePrScore =
    cmePrTarget > 0
      ? (Math.min(record.cmePr, cmePrTarget) / cmePrTarget) * 5
      : 0;
  const dailyReportScore =
    dailyTarget > 0
      ? (Math.min(record.dailyReports, dailyTarget) / dailyTarget) * 10
      : 0;

  return {
    salesScore,
    productScore,
    institutionalScore,
    cmePrScore,
    dailyReportScore,
    total:
      salesScore +
      productScore +
      institutionalScore +
      cmePrScore +
      dailyReportScore,
  };
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const scoreTextColor = (pct: number) =>
  pct >= 100
    ? "text-emerald-600"
    : pct >= 80
      ? "text-blue-600"
      : pct >= 60
        ? "text-amber-500"
        : "text-red-500";

const scoreBgBorder = (pct: number) =>
  pct >= 100
    ? "bg-emerald-50 border-emerald-200"
    : pct >= 80
      ? "bg-blue-50 border-blue-200"
      : pct >= 60
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";

const fmt = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 148 }: { score: number; size?: number }) {
  const sw = size < 110 ? 7 : 10;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - Math.min(score / 100, 1.2) * circ;
  const color =
    score >= 100
      ? "#10b981"
      : score >= 80
        ? "#2563eb"
        : score >= 60
          ? "#f59e0b"
          : "#ef4444";
  const label =
    score >= 100
      ? "Excellent"
      : score >= 80
        ? "Good"
        : score >= 60
          ? "Average"
          : "Below";

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 0.9s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s",
          }}
        />
      </svg>
      <div className="absolute text-center select-none pointer-events-none">
        <div
          className="font-bold text-gray-900 tabular-nums"
          style={{ fontSize: size < 110 ? 15 : 22 }}
        >
          {score.toFixed(1)}%
        </div>
        {size >= 110 && (
          <div className="text-xs text-gray-400 mt-0.5">{label}</div>
        )}
      </div>
    </div>
  );
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────

function MiniBar({
  value,
  max,
  colorClass = "bg-blue-500",
}: {
  value: number;
  max: number;
  colorClass?: string;
}) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-1.5 rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );
}

// ─── Step Counter ─────────────────────────────────────────────────────────────

function StepCounter({
  value,
  onChange,
  disabled,
  accent = "blue",
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue: "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100",
    emerald:
      "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    amber: "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100",
    rose: "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100",
  };
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled}
        className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
      >
        <FaMinusCircle />
      </button>
      <span className="text-3xl font-bold text-gray-900 w-10 text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center disabled:opacity-40 transition-colors ${accentMap[accent]}`}
      >
        <FaPlusCircle />
      </button>
    </div>
  );
}

// ─── Dot Track ────────────────────────────────────────────────────────────────

function DotTrack({
  value,
  max,
  activeColor,
}: {
  value: number;
  max: number;
  activeColor: string;
}) {
  return (
    <div className="flex gap-1.5 mt-3">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 rounded-full transition-colors ${value > i ? activeColor : "bg-gray-100"}`}
        />
      ))}
    </div>
  );
}

// ─── Info Badge ───────────────────────────────────────────────────────────────

function AutoBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 text-xs font-semibold">
      <FaBolt />
      Auto
    </span>
  );
}

// ─── Sales Breakdown Row ──────────────────────────────────────────────────────

function BreakdownRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className="text-xs font-semibold text-gray-700 tabular-nums">
        {fmt(value)}
      </span>
    </div>
  );
}

// ─── Single Month View ────────────────────────────────────────────────────────

function SingleMonthView({
  record,
  products,
  onSave,
  saving,
}: {
  record: KpiRecord;
  products: KpiProduct[];
  onSave: (r: KpiRecord) => Promise<void>;
  saving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [local, setLocal] = useState<KpiRecord>(record);

  useEffect(() => {
    setLocal(record);
    setIsEditing(false);
  }, [
    record.month,
    record.year,
    record.actualSales,
    record.institutionalVisits,
  ]);

  const scores = calculateKPI(local, products);
  const activeProducts = products.filter((p) => p.active);
  const totalPts = activeProducts.reduce((s, p) => s + p.points, 0);

  const achievedIds = new Set(
    local.productEntries
      .filter((e) => e.achieved)
      .map((e) =>
        typeof e.productId === "string" ? e.productId : e.productId._id,
      ),
  );

  const setNum = (field: keyof KpiRecord, val: number) =>
    setLocal((prev) => ({ ...prev, [field]: val }));

  const toggleProduct = (pid: string) => {
    setLocal((prev) => {
      const others = prev.productEntries.filter(
        (e) =>
          (typeof e.productId === "string" ? e.productId : e.productId._id) !==
          pid,
      );
      const existing = prev.productEntries.find(
        (e) =>
          (typeof e.productId === "string" ? e.productId : e.productId._id) ===
          pid,
      );
      return {
        ...prev,
        productEntries: [
          ...others,
          { productId: pid, achieved: !(existing?.achieved ?? false) },
        ],
      };
    });
  };

  const handleCancel = () => {
    setLocal(record);
    setIsEditing(false);
  };
  const handleSave = async () => {
    await onSave(local);
    setIsEditing(false);
  };

  const salesPct =
    local.salesTarget > 0 ? (local.actualSales / local.salesTarget) * 100 : 0;

  const scoreBreakdown = [
    { label: "Sales", score: scores.salesScore, max: 60, color: "bg-blue-500" },
    {
      label: "Products",
      score: scores.productScore,
      max: 20,
      color: "bg-violet-500",
    },
    {
      label: "Institutional",
      score: scores.institutionalScore,
      max: 5,
      color: "bg-emerald-500",
    },
    {
      label: "CME / PR",
      score: scores.cmePrScore,
      max: 5,
      color: "bg-amber-400",
    },
    {
      label: "Daily Reports",
      score: scores.dailyReportScore,
      max: 10,
      color: "bg-rose-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ── Score summary ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <ScoreRing score={scores.total} />
          <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {scoreBreakdown.map(({ label, score, max, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5 truncate">{label}</p>
                <p
                  className={`text-xl font-bold tabular-nums ${scoreTextColor((score / max) * 100)}`}
                >
                  {score.toFixed(1)}
                  <span className="text-xs font-normal text-gray-300 ml-0.5">
                    /{max}
                  </span>
                </p>
                <div className="mt-2">
                  <MiniBar value={score} max={max} colorClass={color} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit bar ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 italic">
          {isEditing
            ? "Set sales target, CME/PR, daily reports & products, then Save."
            : "Tap Edit to enter data. Sales & institution count are auto-calculated."}
        </p>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 transition-colors"
              >
                {saving && <FiLoader className="animate-spin text-sm" />}
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl border border-blue-200 text-blue-600 text-sm font-semibold hover:bg-blue-50 flex items-center gap-2 transition-colors"
            >
              <BsPencilSquare />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ── Sales Performance ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <HiTrendingUp className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Sales Performance
              </p>
              <p className="text-xs text-gray-400">
                60% of KPI · can exceed if over target
              </p>
            </div>
          </div>
          <span
            className={`text-xl font-bold tabular-nums ${scoreTextColor((scores.salesScore / 60) * 100)}`}
          >
            {scores.salesScore.toFixed(1)} pts
          </span>
        </div>

        {/* Sales target (manual) */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">
            Sales Target (₦)
          </label>
          <input
            type="text"
            value={
              local.salesTarget ? local.salesTarget.toLocaleString("en-NG") : ""
            }
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              setNum("salesTarget", parseFloat(raw) || 0);
            }}
            disabled={!isEditing}
            placeholder="0"
            inputMode="decimal"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
          />
        </div>

        {/* Actual sales (auto) */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-sky-700">
                Actual Sales
              </span>
              <AutoBadge />
            </div>
            <span className="text-sm font-bold text-sky-800 tabular-nums">
              {fmt(local.actualSales)}
            </span>
          </div>
          <div className="divide-y divide-sky-100">
            <BreakdownRow
              label="Institutional Sales"
              value={local.salesBreakdown.institutional}
              color="bg-blue-400"
            />
            <BreakdownRow
              label="Distributor Deals"
              value={local.salesBreakdown.distributor}
              color="bg-violet-400"
            />
            <BreakdownRow
              label="Direct Sales"
              value={local.salesBreakdown.direct}
              color="bg-emerald-400"
            />
          </div>
        </div>

        {/* Achievement bar */}
        {local.salesTarget > 0 && (
          <>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Achievement rate</span>
              <span className="font-semibold text-gray-700">
                {salesPct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(salesPct, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Product Performance ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <LucidePackageCheck className="text-violet-600 text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Product Performance
              </p>
              <p className="text-xs text-gray-400">
                20% of KPI · {totalPts} pts available · {activeProducts.length}{" "}
                products
              </p>
            </div>
          </div>
          <span
            className={`text-xl font-bold tabular-nums ${scoreTextColor((scores.productScore / 20) * 100)}`}
          >
            {scores.productScore.toFixed(1)}
            <span className="text-xs font-normal text-gray-300">/20</span>
          </span>
        </div>

        {totalPts !== 20 && activeProducts.length > 0 && (
          <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <GoAlertFill className="text-amber-500 text-sm flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Active products total <strong>{totalPts} pts</strong> — adjust
              product points so they sum to 20 for a balanced scorecard.
            </p>
          </div>
        )}

        {activeProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No active products. Open{" "}
            <span className="text-violet-500 font-medium">Products</span> to add
            some.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeProducts.map((product) => {
              const done = achievedIds.has(product._id);
              return (
                <button
                  key={product._id}
                  onClick={() => isEditing && toggleProduct(product._id)}
                  disabled={!isEditing}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                    done
                      ? "border-violet-300 bg-violet-50"
                      : "border-gray-100 bg-gray-50"
                  } ${isEditing ? "cursor-pointer hover:border-violet-300" : "cursor-default"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      done
                        ? "bg-violet-500"
                        : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    {done && <FaCircleCheck className="text-white text-xs" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.points} pts
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Institutional + CME/PR ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Institutional — auto-counted */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <RiHospitalFill className="text-emerald-600 text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-900 text-sm">
                  Institutional
                </p>
                <AutoBadge />
              </div>
              <p className="text-xs text-gray-400">
                5% · 2 institutions/month · each = 2.5%
              </p>
            </div>
          </div>

          <p className="text-xs text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5 mb-4">
            Counts distinct institutions you sold to this month.
          </p>

          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {local.institutionalVisits}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">institutions</p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-bold tabular-nums ${scoreTextColor((scores.institutionalScore / 5) * 100)}`}
              >
                {scores.institutionalScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">of 5 pts</p>
            </div>
          </div>
          <DotTrack
            value={Math.min(local.institutionalVisits, 2)}
            max={2}
            activeColor="bg-emerald-400"
          />
        </div>

        {/* CME / PR — manual */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <FaCertificate className="text-amber-500 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">CME / PR</p>
              <p className="text-xs text-gray-400">
                5% · each ={" "}
                {local.cmePrTarget > 0
                  ? (5 / local.cmePrTarget).toFixed(1)
                  : "2.5"}{" "}
                pts
              </p>
            </div>
          </div>

          {/* Target input */}
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs text-gray-400 flex-shrink-0">
              Monthly target
            </label>
            <input
              type="number"
              min={1}
              value={local.cmePrTarget || ""}
              onChange={(e) =>
                setNum("cmePrTarget", parseInt(e.target.value) || 2)
              }
              disabled={!isEditing}
              className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
            />
            <span className="text-xs text-gray-400">events</span>
          </div>

          <div className="flex items-center justify-between">
            <StepCounter
              value={local.cmePr}
              onChange={(v) => setNum("cmePr", v)}
              disabled={!isEditing}
              accent="amber"
            />
            <div className="text-right">
              <p
                className={`text-2xl font-bold tabular-nums ${scoreTextColor((scores.cmePrScore / 5) * 100)}`}
              >
                {scores.cmePrScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">of 5 pts</p>
            </div>
          </div>
          <DotTrack
            value={Math.min(local.cmePr, local.cmePrTarget)}
            max={Math.max(local.cmePrTarget, 1)}
            activeColor="bg-amber-400"
          />
        </div>
      </div>

      {/* ── Daily Reports ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <HiDocumentReport className=" text-rose-500 text-lg" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Daily Reports
              </p>
              <p className="text-xs text-gray-400">
                10% · each ={" "}
                {local.dailyReportsTarget > 0
                  ? (10 / local.dailyReportsTarget).toFixed(2)
                  : "0.5"}{" "}
                pts
              </p>
            </div>
          </div>
          <span
            className={`text-xl font-bold tabular-nums ${scoreTextColor((scores.dailyReportScore / 10) * 100)}`}
          >
            {scores.dailyReportScore.toFixed(1)}
            <span className="text-xs font-normal text-gray-300">/10 pts</span>
          </span>
        </div>

        {/* Target input */}
        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-gray-400 flex-shrink-0">
            Monthly target
          </label>
          <input
            type="number"
            min={1}
            value={local.dailyReportsTarget || ""}
            onChange={(e) =>
              setNum("dailyReportsTarget", parseInt(e.target.value) || 20)
            }
            disabled={!isEditing}
            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50 disabled:text-gray-400 transition"
          />
          <span className="text-xs text-gray-400">reports</span>
        </div>

        <div className="flex items-center gap-5">
          <StepCounter
            value={local.dailyReports}
            onChange={(v) => setNum("dailyReports", v)}
            disabled={!isEditing}
            accent="rose"
          />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{local.dailyReports} sent</span>
              <span>Target: {local.dailyReportsTarget}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 rounded-full bg-rose-400 transition-all duration-500"
                style={{
                  width: `${Math.min((local.dailyReports / Math.max(local.dailyReportsTarget, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              {[
                0,
                Math.round(local.dailyReportsTarget * 0.25),
                Math.round(local.dailyReportsTarget * 0.5),
                Math.round(local.dailyReportsTarget * 0.75),
                local.dailyReportsTarget,
              ].map((n) => (
                <span key={n} className="text-xs text-gray-300">
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Month Summary Card ───────────────────────────────────────────────────────

function MonthCard({
  record,
  products,
}: {
  record: KpiRecord;
  products: KpiProduct[];
}) {
  const scores = calculateKPI(record, products);
  const pct = scores.total;

  return (
    <div
      className={`bg-white rounded-2xl border-2 shadow-sm p-5 ${scoreBgBorder(pct)}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-900">
          {MONTHS[record.month - 1]} {record.year}
        </h4>
        <span
          className={`text-2xl font-bold tabular-nums ${scoreTextColor(pct)}`}
        >
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Sales breakdown inside card */}
      <div className="mb-3 bg-gray-50 rounded-xl px-3 py-2 space-y-0.5">
        <BreakdownRow
          label="Institutional"
          value={record.salesBreakdown.institutional}
          color="bg-blue-400"
        />
        <BreakdownRow
          label="Distributor"
          value={record.salesBreakdown.distributor}
          color="bg-violet-400"
        />
        <BreakdownRow
          label="Direct"
          value={record.salesBreakdown.direct}
          color="bg-emerald-400"
        />
        <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between">
          <span className="text-xs font-semibold text-gray-600">Total</span>
          <span className="text-xs font-bold text-gray-800 tabular-nums">
            {fmt(record.actualSales)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {[
          {
            label: "Sales",
            score: scores.salesScore,
            max: 60,
            color: "bg-blue-500",
          },
          {
            label: "Products",
            score: scores.productScore,
            max: 20,
            color: "bg-violet-500",
          },
          {
            label: "Institutional",
            score: scores.institutionalScore,
            max: 5,
            color: "bg-emerald-500",
          },
          {
            label: "CME/PR",
            score: scores.cmePrScore,
            max: 5,
            color: "bg-amber-400",
          },
          {
            label: "Daily Reports",
            score: scores.dailyReportScore,
            max: 10,
            color: "bg-rose-400",
          },
        ].map(({ label, score, max, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{label}</span>
              <span className="font-medium tabular-nums">
                {score.toFixed(1)}/{max}
              </span>
            </div>
            <MiniBar value={score} max={max} colorClass={color} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Product Manager Modal ────────────────────────────────────────────────────

function ProductManagerModal({
  products,
  onClose,
  onRefresh,
}: {
  products: KpiProduct[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editName, setEditName] = useState("");

  const totalActive = products
    .filter((p) => p.active)
    .reduce((s, p) => s + p.points, 0);

  const addProduct = async () => {
    if (!newName.trim() || !newPoints) return;
    setAdding(true);
    try {
      await fetch("/api/kpi/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          points: parseFloat(newPoints),
        }),
      });
      setNewName("");
      setNewPoints("");
      onRefresh();
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (p: KpiProduct) => {
    await fetch(`/api/kpi/products/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    onRefresh();
  };

  const startEdit = (p: KpiProduct) => {
    setEditId(p._id);
    setEditPoints(String(p.points));
    setEditName(p.name);
  };

  const saveEdit = async (p: KpiProduct) => {
    await fetch(`/api/kpi/products/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim() || p.name,
        points: parseFloat(editPoints),
      }),
    });
    setEditId(null);
    onRefresh();
  };

  const deleteProduct = async (p: KpiProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await fetch(`/api/kpi/products/${p._id}`, { method: "DELETE" });
    onRefresh();
  };

  const ptColor =
    totalActive > 20
      ? "text-red-500 font-semibold"
      : totalActive === 20
        ? "text-emerald-600 font-semibold"
        : "text-amber-500 font-semibold";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">Manage KPI Products</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Active total:{" "}
              <span className={ptColor}>{totalActive.toFixed(1)} / 20 pts</span>
              {totalActive !== 20 && (
                <span className="text-gray-300"> — should equal 20</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <AiFillCloseCircle />
          </button>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {products.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No products yet. Add one below.
            </p>
          )}
          {products.map((p) => (
            <div
              key={p._id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                p.active
                  ? "border-gray-200 bg-white"
                  : "border-dashed border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                {editId === p._id ? (
                  <div className="space-y-1.5">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
                      placeholder="Product name"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editPoints}
                        onChange={(e) => setEditPoints(e.target.value)}
                        className="w-16 border border-blue-300 rounded-lg px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        autoFocus
                      />
                      <span className="text-xs text-gray-400">pts</span>
                      <button
                        onClick={() => saveEdit(p)}
                        className="text-xs text-blue-600 font-semibold ml-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="text-xs text-gray-400 ml-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      className={`text-sm font-medium truncate ${p.active ? "text-gray-800" : "text-gray-400"}`}
                    >
                      {p.name}
                    </p>
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {p.points} pts · tap to edit
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => toggleActive(p)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors flex-shrink-0 ${
                  p.active
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {p.active ? "Active" : "Inactive"}
              </button>

              <button
                onClick={() => deleteProduct(p)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <FcFullTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Add Product
          </p>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProduct()}
              placeholder="Product name"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProduct()}
              placeholder="pts"
              className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={addProduct}
              disabled={adding || !newName.trim() || !newPoints}
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {adding ? <FiLoader className=" animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main KPI Page ────────────────────────────────────────────────────────────

export default function KpiPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    currentMonth,
  ]);
  const [kpiData, setKpiData] = useState<Record<string, KpiRecord>>({});
  const [products, setProducts] = useState<KpiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const key = (year: number, month: number) => `${year}-${month}`;

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/kpi/products");
    if (res.ok) setProducts(await res.json());
  }, []);

  // ── Fetch KPI records ──────────────────────────────────────────────────────
  const fetchKpi = useCallback(async () => {
    if (selectedMonths.length === 0) return;
    setLoading(true);
    try {
      const param = selectedMonths.map((m) => `${selectedYear}-${m}`).join(",");
      const res = await fetch(`/api/kpi?months=${param}`);
      if (!res.ok) return;
      const records: KpiRecord[] = await res.json();
      const map: Record<string, KpiRecord> = {};
      records.forEach((r) => {
        map[key(r.year, r.month)] = r;
      });
      // Fill gaps with empty records
      selectedMonths.forEach((m) => {
        if (!map[key(selectedYear, m)])
          map[key(selectedYear, m)] = emptyRecord(m, selectedYear);
      });
      setKpiData(map);
    } finally {
      setLoading(false);
    }
  }, [selectedMonths, selectedYear]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    fetchKpi();
  }, [fetchKpi]);

  // ── Save record ────────────────────────────────────────────────────────────
  const saveRecord = async (record: KpiRecord) => {
    setSaving(true);
    try {
      const payload = {
        month: record.month,
        year: record.year,
        salesTarget: record.salesTarget,
        cmePr: record.cmePr,
        cmePrTarget: record.cmePrTarget,
        dailyReports: record.dailyReports,
        dailyReportsTarget: record.dailyReportsTarget,
        productEntries: record.productEntries.map((e) => ({
          productId:
            typeof e.productId === "string" ? e.productId : e.productId._id,
          achieved: e.achieved,
        })),
      };
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved: KpiRecord = await res.json();
        setKpiData((prev) => ({
          ...prev,
          [key(saved.year, saved.month)]: saved,
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleMonth = (m: number) =>
    setSelectedMonths((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : [...prev, m].sort((a, b) => a - b),
    );

  const sorted = [...selectedMonths].sort((a, b) => a - b);
  const isSingle = sorted.length === 1;
  const allRecords = sorted
    .map((m) => kpiData[key(selectedYear, m)])
    .filter(Boolean);
  const avgScore =
    allRecords.length > 0
      ? allRecords.reduce((s, r) => s + calculateKPI(r, products).total, 0) /
        allRecords.length
      : 0;

  return (
    <div className="px-4 py-6  w-full pb-16 space-y-5 overflow-y-auto">
      <div className="w-full ">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="mt-16">
            <h1 className="text-2xl font-bold text-gray-900">KPI Tracker</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Monthly performance scorecard
            </p>
          </div>
          <button
            onClick={() => setShowProducts(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LucidePackageCheck />
            <span className="hidden sm:inline">Products</span>
          </button>
        </div>

        {/* ── Year + Month selector ── */}
        <div className="bg-white mt-8 rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear((y) => y - 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
              >
                <FaChevronLeft />
              </button>
              <span className="font-bold text-gray-900 w-12 text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => y + 1)}
                disabled={selectedYear >= currentYear}
                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <FaChevronRight />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {selectedMonths.length > 1 && (
                <span className="text-xs text-blue-600 font-semibold">
                  {selectedMonths.length} months selected
                </span>
              )}
              {selectedMonths.length > 0 && (
                <button
                  onClick={() => setSelectedMonths([])}
                  className="text-sm text-red-400 font-semibold hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Month pills */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {MONTHS.map((label, idx) => {
              const m = idx + 1;
              const selected = selectedMonths.includes(m);
              const isCurrent =
                m === currentMonth && selectedYear === currentYear;
              return (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    selected
                      ? "bg-blue-600 text-white shadow-sm"
                      : isCurrent
                        ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content area ── */}
        {selectedMonths.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <FaCalendarDays />
            <p className="text-sm font-medium">
              Select one or more months above
            </p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-gray-300 flex flex-col items-center gap-3">
            <FiLoader className="animate-spin text-4xl block mb-3" />
            <p className="text-sm">Loading…</p>
          </div>
        ) : isSingle ? (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {MONTHS[sorted[0] - 1]} {selectedYear}
            </h2>
            {kpiData[key(selectedYear, sorted[0])] && (
              <SingleMonthView
                record={kpiData[key(selectedYear, sorted[0])]}
                products={products}
                onSave={saveRecord}
                saving={saving}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aggregate banner */}
            <div className="bg-blue-600 rounded-2xl p-5 flex items-center justify-between text-white">
              <div>
                <p className="text-blue-200 text-sm font-medium">
                  {sorted.map((m) => MONTHS[m - 1]).join(", ")}
                </p>
                <p className="text-4xl font-bold mt-1 tabular-nums">
                  {avgScore.toFixed(1)}%
                </p>
                <p className="text-blue-300 text-xs mt-1">
                  Average KPI across {sorted.length} months
                </p>
              </div>
              <ScoreRing score={avgScore} size={100} />
            </div>

            {/* Per-month cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sorted.map((m) => {
                const r = kpiData[key(selectedYear, m)];
                return r ? (
                  <MonthCard key={m} record={r} products={products} />
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* ── Product manager modal ── */}
        {showProducts && (
          <ProductManagerModal
            products={products}
            onClose={() => setShowProducts(false)}
            onRefresh={fetchProducts}
          />
        )}
      </div>
    </div>
  );
}
