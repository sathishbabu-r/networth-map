"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { assessmentFromMemory, memoryFromAssessment } from "../../shared/map-engine";
import type { Id } from "../../convex/_generated/dataModel";
import {
  actionCategoryLabels,
  assetCategoryLabels,
  calculateAnnualInterest,
  calculateMap,
  emptyAssessment,
  formatActionsForClipboard,
  liabilityTypeLabels,
  normalizeAssetPurpose,
  type ActionCategory,
  type Asset,
  type AssetCategory,
  type AssessmentData,
  type Liability,
  type LiabilityType,
  type LifestyleCategory,
  type LifestyleChange,
  type ProposedAction,
  type VisionLevel,
  type WealthGoal,
  type WealthGoalDetail,
} from "../../shared/networth-engine";
import {
  isValidIsoDate,
  localIsoDate,
  normalizePercentageInput,
} from "./networth-inputs";
import {
  type ClarityRating,
  type FeedbackCategory,
  type ValidationCode,
  useProductInsights,
} from "./use-product-insights";

const STORAGE_KEY = "integrated-networth-map-unused";
const STORAGE_VERSION = 17;
const PROFILE_REQUIRED_ERROR =
  "Choose Founders, Business Owners, Professionals or Salaried to continue.";
const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  confusing: "Something is confusing",
  cannot_continue: "I cannot continue",
  incorrect_number: "A number looks incorrect",
  display_problem: "Something does not display correctly",
  other: "Something else",
};
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const CALENDLY_CONTACT_URL = "https://calendly.com/sathishbabur/new-meeting";
const WHATSAPP_CONTACT_URL =
  "https://wa.me/919884498689?text=Hi%2C%20I%20completed%20my%20Networth%20MAP%20and%20would%20like%20help%20understanding%20my%20priorities%20and%20practical%20next%20steps.";
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const digits = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const stepNames = [
  "Welcome",
  "Earn",
  "Own",
  "Owe",
  "Spend",
  "Invest",
  "Blueprint",
  "Lifestyle",
  "Goals",
  "Milestone",
  "Reflect",
  "MAP",
];
const nextStepLabels: Record<number, string> = {
  1: "Add My Assets",
  2: "Add My Liabilities",
  3: "Add My Expenses",
  4: "Add My Investments",
  5: "Review My Financial Plan",
  6: "Define My Vision",
  7: "Define My Goals",
  8: "Set My Wealth Milestone",
  9: "Review My Actions",
  10: "Generate My MAP",
};
const actionCategoryShortLabels: Record<ActionCategory, string> = {
  "review-asset": "Review Assets",
  "increase-liquidity": "Build Emergency Cash",
  "increase-investing": "Invest More",
  "reallocate-investments": "Reallocate",
  "reduce-spending": "Reduce Spending",
  "repay-debt": "Repay Debt",
  "change-income": "Increase Income",
  "protect-risk": "Strengthen Protection",
  "fund-goal": "Fund a Goal",
  "tax-planning": "Review Tax",
  "estate-planning": "Plan Estate",
  "separate-finances": "Separate Finances",
  other: "Other Action",
};
const actionCategoryChoices: ActionCategory[] = [
  "increase-liquidity",
  "increase-investing",
  "reduce-spending",
  "repay-debt",
  "change-income",
  "fund-goal",
  "protect-risk",
  "other",
];

function JourneyIcon({ kind }: { kind: "blueprint" | "vision" | "map" }) {
  if (kind === "blueprint") {
    return (
      <svg className="journey-icon" aria-hidden="true" viewBox="0 0 24 24">
        <rect x="4" y="4" width="6" height="6" />
        <rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" />
        <rect x="14" y="14" width="6" height="6" />
      </svg>
    );
  }
  if (kind === "vision") {
    return (
      <svg className="journey-icon" aria-hidden="true" viewBox="0 0 24 24">
        <path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z" />
      </svg>
    );
  }
  return (
    <svg className="journey-icon" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9Z" />
    </svg>
  );
}
const assetDescriptionPlaceholders: Record<AssetCategory, string> = {
  cash: "e.g. Emergency Fund",
  financial: "e.g. Equity Mutual Funds",
  property: "e.g. Farmland, Pune",
  business: "e.g. Photography Studio Ownership",
  retirement: "e.g. EPF Balance",
  gold: "e.g. Family Jewellery",
  other: "e.g. Private Investment",
};
const liabilityDescriptionPlaceholders: Record<LiabilityType, string> = {
  property: "e.g. Primary Home Loan",
  business: "e.g. Business Term Loan",
  personal: "e.g. Education Loan",
  vehicle: "e.g. Car Loan",
  credit: "e.g. Credit Card Balance",
  other: "e.g. Loan from Family",
};
const wealthGoalLabels: Record<WealthGoal, string> = {
  progress: "Goals",
  dreams: "Dreams",
  desires: "Desires",
  legacy: "Experiences",
  needs: "Protection",
  commitments: "Commitments",
  responsibilities: "Contribution",
  other: "Other",
};
const lifestyleCategoryLabels: Record<LifestyleCategory, string> = {
  lifestyle: "Lifestyle",
  wealth: "Wealth",
  home: "Home & Living",
  mobility: "Transport",
  travel: "Experiences",
  health: "Health",
  family: "Family & Care",
  convenience: "Support & Convenience",
  learning: "Learning",
  giving: "Giving",
  other: "Other",
};
const lifestyleCategoryOptions: LifestyleCategory[] = [
  "health",
  "wealth",
  "learning",
  "travel",
  "lifestyle",
  "mobility",
  "giving",
  "other",
];
const goalPriorityRank: Record<WealthGoalDetail["priority"], number> = {
  must: 0,
  important: 1,
  aspirational: 2,
  "": 3,
};
const normalizeWealthGoal = (value: unknown): WealthGoal | null => {
  const goal = String(value);
  if (goal in wealthGoalLabels) return goal as WealthGoal;
  if (goal === "financial-resilience") return "needs";
  if (goal === "debt-freedom") return "commitments";
  if (goal === "family-care") return "responsibilities";
  if (["home-property", "education", "business"].includes(goal))
    return "progress";
  if (goal === "experiences") return "desires";
  if (goal === "retirement-choice") return "dreams";
  return null;
};
type SavedAssessment = {
  version: number;
  expiresAt: number;
  step: number;
  data: AssessmentData;
};
const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
const rawNumber = (value: string) => value.replace(/[^0-9]/g, "");
const numberValue = (value: string) => Number(value) || 0;
const isMoneyValue = (value: string, allowZero = false) => {
  if (value === "") return false;
  const amount = Number(value);
  return (
    Number.isSafeInteger(amount) &&
    (allowZero ? amount >= 0 : amount > 0)
  );
};
const compactMoney = (value: number) =>
  value >= 10_000_000
    ? `₹${(value / 10_000_000).toFixed(1)} Cr`
    : value >= 100_000
      ? `₹${(value / 100_000).toFixed(1)} L`
      : money.format(value);
const questionMoney = (value: number) => {
  const compactNumber = (amount: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(amount);
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (absoluteValue >= 10_000_000)
    return `${sign}₹${compactNumber(absoluteValue / 10_000_000)}\u00a0crore`;
  if (absoluteValue >= 100_000)
    return `${sign}₹${compactNumber(absoluteValue / 100_000)}\u00a0lakh`;
  return money.format(value);
};
const monthlyQuestionMoney = (value: number) =>
  `${questionMoney(value)}\u00a0per\u00a0month`;
const metricPercent = (value: number | null) =>
  value === null ? "Not available" : `${value.toFixed(1)}%`;
const percentageOf = (part: number, whole: number) =>
  whole > 0 ? (part / whole) * 100 : null;
const compactLabel = (value: string, maxLength = 14) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
const investingQuestion = (rate: number) => {
  if (rate <= 0) return "What first commitment would make investing automatic?";
  if (rate < 10) return `What would lift ${rate.toFixed(1)}% without straining cash flow?`;
  if (rate < 20) return `Is ${rate.toFixed(1)}% enough for your timeline and priorities?`;
  return `Which goal is your ${rate.toFixed(1)}% investing rate funding first?`;
};
const validationCodeFor = (step: number, message: string): ValidationCode => {
  if (step === 1)
    return message === PROFILE_REQUIRED_ERROR
      ? "profile_required"
      : "income_invalid";
  if (step === 2) return "assets_incomplete";
  if (step === 3) return "liabilities_incomplete";
  if (step === 4) return "expenses_invalid";
  if (step === 5) return "investing_invalid";
  if (step === 7) return "lifestyle_incomplete";
  if (step === 8) return "goals_incomplete";
  if (step === 9) return "milestone_incomplete";
  return "actions_incomplete";
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const storedString = (value: unknown) => {
  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  if (
    typeof normalized === "string" &&
    !/^\d+$/.test(normalized)
  )
    return "";
  const numeric = Number(normalized);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? String(numeric) : "";
};
const storedText = (value: unknown) =>
  typeof value === "string" ? value.slice(0, 500) : "";
const storedRate = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.trim() === "") return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100
    ? String(numeric)
    : "";
};
const storedDate = (value: unknown) => {
  if (typeof value === "string" && isValidIsoDate(value))
    return value;
  if (
    typeof value === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
    isValidIsoDate(`${value}-01`)
  )
    return `${value}-01`;
  const legacyYear = storedString(value);
  return /^\d{4}$/.test(legacyYear) ? `${legacyYear}-01-01` : "";
};

export function normalizeSavedAssessment(value: unknown): SavedAssessment | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  if (
    value.version !== undefined &&
    Number(value.version) > STORAGE_VERSION
  )
    return null;
  const expiresAt = Number(value.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  const source = value.data;
  const savedVisionLevel =
    source.visionLevel === "security" ||
    source.visionLevel === "independence" ||
    source.visionLevel === "freedom"
      ? source.visionLevel
      : "";
  const visionChoiceConfirmed =
    source.visionChoiceConfirmed === true ||
    source.visionLevel === "security" ||
    source.visionLevel === "freedom";
  const assetCategories = new Set(Object.keys(assetCategoryLabels));
  const liabilityTypes = new Set(Object.keys(liabilityTypeLabels));
  const actionCategories = new Set(Object.keys(actionCategoryLabels));
  const lifestyleCategories = new Set(Object.keys(lifestyleCategoryLabels));
  const legacyRepaymentIncludedInNeeds =
    source.loanRepaymentIncludedInNeeds === true;
  const wealthGoalDetails = isRecord(source.wealthGoalDetails)
    ? Object.fromEntries(
        Object.entries(source.wealthGoalDetails)
          .filter(([, detail]) => isRecord(detail))
          .map(([goal, detail]) => {
            const savedDetail = isRecord(detail) ? detail : {};
            const normalizedGoal = normalizeWealthGoal(goal);
            return [
              normalizedGoal,
              {
                description: storedText(savedDetail.description),
                amount: storedString(savedDetail.amount),
                targetYear: storedString(savedDetail.targetYear),
                priority:
                  savedDetail.priority === "must" ||
                  savedDetail.priority === "important" ||
                  savedDetail.priority === "aspirational"
                    ? savedDetail.priority
                    : "",
                flexibility:
                  savedDetail.flexibility === "date" ||
                  savedDetail.flexibility === "amount" ||
                  savedDetail.flexibility === "both" ||
                  savedDetail.flexibility === "neither"
                    ? savedDetail.flexibility
                    : "",
              },
            ];
          })
          .filter(([goal]) => goal !== null),
      )
    : {};
  const assets: Asset[] = Array.isArray(source.assets)
    ? source.assets.filter(isRecord).slice(0, 100).map((asset) => ({
        id: storedText(asset.id) || makeId(),
        description: storedText(asset.description),
        category: (assetCategories.has(String(asset.category))
          ? asset.category
          : "other") as AssetCategory,
        value: storedString(asset.value),
        annualNetIncome: storedString(asset.annualNetIncome),
        purpose: normalizeAssetPurpose(asset.purpose),
      }))
    : [];
  const lifestyleChanges: LifestyleChange[] = Array.isArray(
    source.lifestyleChanges,
  )
    ? source.lifestyleChanges
        .filter(isRecord)
        .slice(0, 50)
        .map((change) => ({
          id: storedText(change.id) || makeId(),
          category: (lifestyleCategories.has(String(change.category))
            ? change.category
            : "other") as LifestyleCategory,
          description: storedText(change.description),
          direction:
            change.direction === "decrease" ? "decrease" : "increase",
          monthlyAmount: storedString(change.monthlyAmount),
          startDate: storedDate(
            change.startDate ?? change.startMonth ?? change.startYear,
          ),
        }))
    : [];
  const liabilities: Liability[] = Array.isArray(source.liabilities)
    ? source.liabilities.filter(isRecord).slice(0, 100).map((liability) => ({
        id: storedText(liability.id) || makeId(),
        description: storedText(liability.description),
        type: (liabilityTypes.has(String(liability.type))
          ? liability.type
          : "other") as LiabilityType,
        value: storedString(liability.value),
        interestRate: storedRate(liability.interestRate),
        annualRepayment: storedString(liability.annualRepayment) || "0",
        repaymentIncludedInNeeds:
          typeof liability.repaymentIncludedInNeeds === "boolean"
            ? liability.repaymentIncludedInNeeds
            : legacyRepaymentIncludedInNeeds,
        classification:
          liability.classification === "business" ? "business" : "personal",
      }))
    : [];
  const proposedActions: ProposedAction[] = Array.isArray(source.proposedActions)
    ? source.proposedActions.filter(isRecord).slice(0, 50).map((action) => ({
        id: storedText(action.id) || makeId(),
        category: (actionCategories.has(String(action.category))
          ? action.category
          : "") as ActionCategory | "",
        description: storedText(action.description),
        targetDate: storedDate(action.targetDate ?? action.targetMonth),
      }))
    : [];
  const savedVersion = Number(value.version ?? 0);
  const savedStep = Number(value.step);
  let step = savedStep;
  if (savedVersion <= 11 && step >= 8) step += 1;
  if (savedVersion <= 13 && step >= 9) step += 1;
  const targetNetworth = storedString(source.targetNetworth);
  const wealthMilestoneChoice =
    source.wealthMilestoneChoice === "yes" || targetNetworth
      ? "yes"
      : source.wealthMilestoneChoice === "not-yet" || savedVersion <= 13
        ? "not-yet"
        : "";
  return {
    version: STORAGE_VERSION,
    expiresAt,
    step: Number.isInteger(step) && step >= 1 && step <= 11 ? step : 1,
    data: {
      userType:
        source.userType === "founder" ||
        source.userType === "business-owner" ||
        source.userType === "professional" ||
        source.userType === "salaried"
          ? source.userType
          : "",
      grossPersonalIncome: storedString(source.grossPersonalIncome),
      effectiveTaxRate: storedRate(source.effectiveTaxRate),
      assets,
      liabilities,
      hasNoLiabilitiesConfirmed:
        source.hasNoLiabilitiesConfirmed === true && liabilities.length === 0,
      loanRepaymentIncludedInNeeds:
        legacyRepaymentIncludedInNeeds,
      monthlyNeeds: storedString(source.monthlyNeeds),
      monthlyWants: storedString(source.monthlyWants),
      annualInvesting: storedString(source.annualInvesting),
      visionLevel: visionChoiceConfirmed ? savedVisionLevel : "",
      visionChoiceConfirmed,
      wealthGoals: Array.isArray(source.wealthGoals)
        ? Array.from(
            new Set(source.wealthGoals.map(normalizeWealthGoal).filter(Boolean)),
          ).slice(0, 8) as WealthGoal[]
        : [],
      wealthGoalDetails,
      lifestyleChanges,
      desiredLifestyleMonthly: storedString(source.desiredLifestyleMonthly),
      currentAge: storedString(source.currentAge),
      targetTiming: source.targetTiming === "year" ? "year" : "age",
      targetAge: storedString(source.targetAge),
      targetYear: storedString(source.targetYear),
      targetNetworth,
      wealthMilestoneChoice,
      moneyPurpose: storedText(source.moneyPurpose),
      wealthMotivation: storedText(source.wealthMotivation),
      proposedActions,
    },
  };
}

function CurrencyField({
  label,
  value,
  onChange,
  note,
  required = true,
  invalid = false,
  errorMessage,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  note?: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string;
}) {
  const numericValue = numberValue(value);
  const isMonthly = /monthly/i.test(label);
  const isLargeBalance = /current value|outstanding|milestone|amount today|financial freedom target/i.test(label);
  const suggestedMax = isMonthly
    ? 500_000
    : isLargeBalance
      ? 1_000_000_000
      : 10_000_000;
  const midpointValue = isMonthly
    ? 100_000
    : isLargeBalance
      ? 100_000_000
      : 2_500_000;
  const sliderStep = isMonthly ? 1_000 : isLargeBalance ? 100_000 : 10_000;
  const sliderMaxValue = Math.max(
    suggestedMax,
    Math.ceil((numericValue * 1.25) / sliderStep) * sliderStep,
  );
  const sliderPosition =
    numericValue <= midpointValue
      ? 500 * Math.sqrt(numericValue / midpointValue)
      : 500 +
        500 *
          Math.sqrt(
            Math.min(
              1,
              (numericValue - midpointValue) /
                (sliderMaxValue - midpointValue),
            ),
          );
  const amountAtSliderPosition = (position: number) => {
    const amount =
      position <= 500
        ? midpointValue * Math.pow(position / 500, 2)
        : midpointValue +
          (sliderMaxValue - midpointValue) *
            Math.pow((position - 500) / 500, 2);
    return Math.round(amount / sliderStep) * sliderStep;
  };
  return (
    <label className={`field amount-field${invalid ? " invalid" : ""}`}>
      <span className="field-heading">
        <span>{label}</span>
        {required && <b>Required</b>}
      </span>
      <div className="currency-input">
        <b>₹</b>
        <input
          inputMode="numeric"
          maxLength={24}
          value={value ? digits.format(numberValue(value)) : ""}
          onChange={(event) => onChange(rawNumber(event.target.value))}
          placeholder="0"
          aria-required={required}
          aria-invalid={invalid || undefined}
        />
      </div>
      <input
        className="amount-slider"
        type="range"
        min="0"
        max="1000"
        step="1"
        value={sliderPosition}
        onChange={(event) =>
          onChange(String(amountAtSliderPosition(numberValue(event.target.value))))
        }
        aria-label={`Adjust ${label}`}
        aria-valuemin={0}
        aria-valuemax={sliderMaxValue}
        aria-valuenow={numericValue}
        aria-valuetext={money.format(numericValue)}
      />
      {note && <small>{note}</small>}
      {invalid && errorMessage && (
        <small className="field-error" role="alert">{errorMessage}</small>
      )}
    </label>
  );
}
function PageHeading({
  number,
  eyebrow,
  title,
  copy,
}: {
  number: string;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <header className="page-heading">
      <span>{number}</span>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </header>
  );
}
function Metric({
  label,
  value,
  context,
  detail,
  note,
  question,
  featured = false,
}: {
  label: string;
  value: string;
  context?: string;
  detail?: string;
  note?: string;
  question?: string;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "metric featured" : "metric"}>
      <span>{label}</span>
      <div className="metric-value">
        {context ? <small className="metric-context">{context}</small> : null}
        <strong>{value}</strong>
        {detail ? <small className="metric-insight">{detail}</small> : null}
        {note ? <small className="metric-accuracy-note">{note}</small> : null}
        {question ? <small className="metric-question">{question}</small> : null}
      </div>
    </article>
  );
}

function LiveNetworthPreview({
  totalAssets,
  totalLiabilities,
  networth,
}: {
  totalAssets: number;
  totalLiabilities: number;
  networth: number;
}) {
  return (
    <section className="live-networth-preview" aria-label="Live net worth estimate">
      <div className="live-networth-primary">
        <span>Live net worth estimate</span>
        <output>{money.format(networth)}</output>
      </div>
      <div className="live-networth-equation" aria-label="Assets minus liabilities">
        <span>
          Assets <output>{money.format(totalAssets)}</output>
        </span>
        <i>−</i>
        <span>
          Liabilities <output>{money.format(totalLiabilities)}</output>
        </span>
      </div>
    </section>
  );
}

export function NetworthAssessment({ memory, onChange, onDelete, onDraftStatus }: { onDraftStatus?: (dirty: boolean) => void; onDelete?: () => void; memory?: import("../../shared/map-schema").MapMemory | null; onChange: (data: AssessmentData, step: number) => void }) {
  const {
    track,
    submitFeedback,
    markMapCompleted,
    submitCompletedMapEmail,
  } = useProductInsights();
  const [step, setStep] = useState(memory?.step ?? 0);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [data, setData] = useState<AssessmentData>(() => assessmentFromMemory(memory));
  const draftStatus=useRef(onDraftStatus);draftStatus.current=onDraftStatus;
  const received = useRef(JSON.stringify(memory));
  const lastSent = useRef<import("../../shared/map-schema").MapMemory | null>(null);
  const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])) : value;
  const published = useRef(JSON.stringify({data,step}));
  const publishRef = useRef(onChange); publishRef.current=onChange;
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [recovery, setRecovery] = useState<SavedAssessment | null>(null);
  const [storageWarning, setStorageWarning] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [completionEventId, setCompletionEventId] =
    useState<Id<"productInsightEvents"> | null>(null);
  const [emailCaptureDismissed, setEmailCaptureDismissed] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [showAssetAddMenu, setShowAssetAddMenu] = useState(false);
  const [showLiabilityAddMenu, setShowLiabilityAddMenu] = useState(false);
  const [returnToFinancialPlan, setReturnToFinancialPlan] = useState(false);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackCategory>("confusing");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [clarityRating, setClarityRating] = useState<ClarityRating | "">("");
  const firstProfileOptionRef = useRef<HTMLButtonElement>(null);
  const recoveryContinueRef = useRef<HTMLButtonElement>(null);
  const feedbackDialogRef = useRef<HTMLDialogElement>(null);
  const blueprint = useMemo(() => calculateMap(data), [data]);
  const mapRecommendations = [
    ...blueprint.actionAssessments.map((assessment) => ({
      id: `action-${assessment.id}`,
      category: actionCategoryLabels[assessment.category],
      title: assessment.action,
      observation: assessment.evidence,
      action: assessment.nextStep,
      reason: assessment.perspective,
    })),
    ...blueprint.unaddressedFindings.map((finding) => ({
      id: `finding-${finding.id}`,
      category: finding.category,
      title: finding.title,
      observation: finding.observation,
      action: finding.action,
      reason: finding.reason,
    })),
  ];
  const unclassifiedAssetCount = data.assets.filter(
    (asset) => !asset.purpose,
  ).length;
  const debtRepaymentWasSubtracted =
    blueprint.annualDebtRepaymentDeducted > 0;
  const debtRepaymentAlreadyCounted =
    data.liabilities.length > 0 &&
    data.liabilities.every(
      (liability) => liability.repaymentIncludedInNeeds === true,
    );
  const showDebtRepaymentStatus =
    debtRepaymentAlreadyCounted ||
    blueprint.annualDebtRepaymentDeducted > 0;
  const surplusLabel = debtRepaymentWasSubtracted
    ? "Estimated Surplus After Debt Repayment"
    : "Available Cash";
  const enteredLifestyleChange = data.lifestyleChanges.reduce(
    (sum, change) =>
      sum +
      (change.direction === "decrease" ? -1 : 1) *
        numberValue(change.monthlyAmount),
    0,
  );
  const visionBaselineChange =
    data.visionLevel === "security" ? -numberValue(data.monthlyWants) : 0;
  const totalLifestyleChange = visionBaselineChange + enteredLifestyleChange;
  const prioritizedWealthGoals = data.wealthGoals
    .map((goal, index) => ({ goal, index }))
    .sort(
      (a, b) =>
        goalPriorityRank[data.wealthGoalDetails[a.goal]?.priority ?? ""] -
          goalPriorityRank[data.wealthGoalDetails[b.goal]?.priority ?? ""] ||
        a.index - b.index,
    )
    .map(({ goal }) => goal);
  const primaryGoal = prioritizedWealthGoals[0];
  const primaryGoalStatement = primaryGoal
    ? data.wealthGoalDetails[primaryGoal]?.description ||
      wealthGoalLabels[primaryGoal]
    : "Your selected life goals";
  const visionLabel = data.visionLevel
    ? data.visionLevel[0].toUpperCase() + data.visionLevel.slice(1)
    : "Vision not yet defined";

  useEffect(() => {
    const signature=JSON.stringify(memory);
    if(signature!==received.current){
      received.current=signature;
      const next=assessmentFromMemory(memory);const nextStep=memory?.step??0;
      if (lastSent.current && nextStep === lastSent.current.step && JSON.stringify(stable(next)) === JSON.stringify(stable(assessmentFromMemory(lastSent.current)))) return;
      published.current=JSON.stringify({data:next,step:nextStep});
      setData(next);setStep(nextStep);
    }
  },[memory]);
  useEffect(()=>{
    const signature=JSON.stringify({data,step});
    if(signature===published.current){draftStatus.current?.(false);return;}
    draftStatus.current?.(true);
    const timeout=setTimeout(()=>{ published.current=signature;try {lastSent.current=memoryFromAssessment(data,memory,step);} catch {lastSent.current=null;}publishRef.current(data,step);draftStatus.current?.(false); },500);
    return ()=>clearTimeout(timeout);
  },[data,step]);
  useEffect(() => {
    if (recovery) queueMicrotask(() => recoveryContinueRef.current?.focus());
  }, [recovery]);
  useEffect(() => {
    track("step_viewed", { step });
  }, [step, track]);
  useEffect(() => {
    if (step !== 11 || completionEventId) return;
    void markMapCompleted()
      .then(setCompletionEventId)
      .catch(() => {
        // Optional email capture must never interrupt the completed MAP.
      });
  }, [completionEventId, markMapCompleted, step]);

  const patchData = (patch: Partial<AssessmentData>) =>
    setData((current) => ({ ...current, ...patch }));
  const isInvalid = (key: string, condition = true) =>
    condition && invalidFields.includes(key);
  const go = (next: number) => {
    setError("");
    setInvalidFields([]);
    setStep(next);
    document.querySelector(".original-map-scroll")?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  const editFromFinancialPlan = (next: number) => {
    setReturnToFinancialPlan(true);
    go(next);
  };
  const returnToPlan = () => {
    setReturnToFinancialPlan(false);
    go(6);
  };
  const validateAndContinue = () => {
    let message = "";
    const fields: string[] = [];
    if (step === 1) {
      if (!data.userType) fields.push("profile");
      if (!isMoneyValue(data.grossPersonalIncome, true)) fields.push("income");
      if (
        data.effectiveTaxRate === "" ||
        !Number.isFinite(Number(data.effectiveTaxRate)) ||
        numberValue(data.effectiveTaxRate) < 0 ||
        numberValue(data.effectiveTaxRate) > 100
      ) fields.push("tax");
      if (fields.includes("profile")) message = PROFILE_REQUIRED_ERROR;
      else if (fields.length)
        message = "Enter annual personal income (₹0 is allowed) and a tax rate between 0% and 100%.";
    }
    if (step === 2) {
      for (const item of data.assets) {
        if (!isMoneyValue(item.value)) fields.push(`asset-${item.id}-value`);
        if (item.annualNetIncome && !isMoneyValue(item.annualNetIncome, true))
          fields.push(`asset-${item.id}-income`);
      }
      if (fields.length) message = "Complete the highlighted fields for every asset you added.";
    }
    if (step === 3) {
      if (!data.liabilities.length && !data.hasNoLiabilitiesConfirmed)
        fields.push("liabilities");
      for (const item of data.liabilities) {
        if (!isMoneyValue(item.value)) fields.push(`liability-${item.id}-value`);
        if (item.interestRate && (!Number.isFinite(Number(item.interestRate)) || Number(item.interestRate) < 0 || Number(item.interestRate) > 100))
          fields.push(`liability-${item.id}-interest`);
      }
      if (fields.length) message = data.liabilities.length
        ? "Complete the highlighted liability fields. Interest may be left blank."
        : "Add a liability or confirm that you currently have none.";
    }
    if (step === 4) {
      if (!isMoneyValue(data.monthlyNeeds)) fields.push("monthly-needs");
      if (!isMoneyValue(data.monthlyWants, true)) fields.push("monthly-wants");
      if (fields.length) message = "Enter monthly Needs and Wants. Enter ₹0 when there is no Wants spending.";
    }
    if (step === 5 && !isMoneyValue(data.annualInvesting, true)) {
      fields.push("annual-investing");
      message = "Enter annual investing, or ₹0 if you are not investing currently.";
    }
    if (step === 7) {
      const currentYear = new Date().getFullYear();
      for (const change of data.lifestyleChanges) {
        const invalidAmount = !isMoneyValue(change.monthlyAmount);
        const invalidDate = !isValidIsoDate(change.startDate) ||
          change.startDate < localIsoDate() ||
          change.startDate > `${currentYear + 100}-12-31`;
        if (invalidAmount) fields.push(`lifestyle-${change.id}-amount`);
        if (invalidDate) fields.push(`lifestyle-${change.id}-date`);
      }
      if (fields.length) message = "Complete the highlighted lifestyle change fields.";
      if (!data.visionLevel || !data.visionChoiceConfirmed) {
        fields.push("vision");
        message = "Choose one Vision for your wealth to support.";
      }
    }
    if (step === 8) {
      if (!data.wealthGoals.length) {
        fields.push("goals");
        message = "Choose at least one specific goal for your wealth.";
      }
      for (const goal of data.wealthGoals) {
        const detail = data.wealthGoalDetails[goal];
        const targetYear = numberValue(detail?.targetYear ?? "");
        if (!detail || !isMoneyValue(detail.amount)) fields.push(`goal-${goal}-amount`);
        if (
          detail?.targetYear &&
          (targetYear <= new Date().getFullYear() ||
            targetYear > new Date().getFullYear() + 100)
        )
          fields.push(`goal-${goal}-year`);
      }
      if (fields.length && data.wealthGoals.length)
        message = "Complete the highlighted fields for every selected goal.";
    }
    if (step === 9) {
      if (!data.wealthMilestoneChoice) {
        fields.push("milestone-choice");
        message = "Choose whether giving your aspiration a number would help.";
      }
      if (
        data.wealthMilestoneChoice === "yes" &&
        !isMoneyValue(data.targetNetworth)
      ) fields.push("target-networth");
      if (data.wealthMilestoneChoice === "yes" &&
        (numberValue(data.targetYear) <= new Date().getFullYear() ||
          numberValue(data.targetYear) > new Date().getFullYear() + 100))
        fields.push("target-year");
      if (fields.some((field) => field === "target-networth" || field === "target-year"))
        message = "Complete the highlighted wealth milestone fields.";
    }
    if (step === 10) {
      for (const item of data.proposedActions) {
        if (!item.category) fields.push(`action-${item.id}-category`);
        if (!item.description.trim()) fields.push(`action-${item.id}-description`);
      }
      if (fields.length && data.proposedActions.length)
        message = "Complete the highlighted fields for every action, or remove the unfinished action.";
    }
    if (message) {
      setError(message);
      setInvalidFields(fields);
      track("validation_error", {
        step,
        validationCode: validationCodeFor(step, message),
      });
      requestAnimationFrame(() => {
        if (fields.includes("profile") && firstProfileOptionRef.current) {
          firstProfileOptionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          firstProfileOptionRef.current.focus({ preventScroll: true });
          return;
        }
        const first = document.querySelector<HTMLElement>("[aria-invalid='true'], [data-invalid='true']");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.focus({ preventScroll: true });
      });
      return;
    }
    track("step_completed", { step });
    go(step + 1);
  };
  const addAsset = (category: AssetCategory) => {
    setData((current) => ({
      ...current,
      assets: [
        ...current.assets,
        { id: makeId(), description: "", category, value: "", purpose: "" },
      ],
    }));
    track("asset_added", { step: 2 });
  };
  const updateAsset = (id: string, patch: Partial<Asset>) =>
    setData((current) => ({
      ...current,
      assets: current.assets.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  const addLiability = (type: LiabilityType) => {
    setData((current) => ({
      ...current,
      liabilities: [
        ...current.liabilities,
        {
          id: makeId(),
          description: "",
          type,
          value: "",
          interestRate: "",
          annualRepayment: "0",
          repaymentIncludedInNeeds: false,
          classification: type === "business" ? "business" : "personal",
        },
      ],
      hasNoLiabilitiesConfirmed: false,
    }));
    track("liability_added", { step: 3 });
  };
  const updateLiability = (id: string, patch: Partial<Liability>) =>
    setData((current) => ({
      ...current,
      liabilities: current.liabilities.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  const addLifestyleChange = (category: LifestyleCategory) =>
    setData((current) => ({
      ...current,
      lifestyleChanges: [
        ...current.lifestyleChanges,
        {
          id: makeId(),
          category,
          description: "",
          direction: "increase",
          monthlyAmount: "",
          startDate: "",
        },
      ],
    }));
  const updateLifestyleChange = (
    id: string,
    patch: Partial<LifestyleChange>,
  ) =>
    setData((current) => ({
      ...current,
      lifestyleChanges: current.lifestyleChanges.map((change) =>
        change.id === id ? { ...change, ...patch } : change,
      ),
    }));
  const updateDesiredLifestyle = (targetValue: string) =>
    setData((current) => {
      const target = numberValue(targetValue);
      if (!current.lifestyleChanges.length) {
        return { ...current, desiredLifestyleMonthly: targetValue };
      }
      const baseline =
        numberValue(current.monthlyNeeds) + numberValue(current.monthlyWants);
      const lastIndex = current.lifestyleChanges.length - 1;
      const otherChanges = current.lifestyleChanges
        .slice(0, lastIndex)
        .reduce(
          (sum, change) =>
            sum +
            (change.direction === "decrease" ? -1 : 1) *
              numberValue(change.monthlyAmount),
          0,
        );
      const latestDifference = target - baseline - otherChanges;
      return {
        ...current,
        desiredLifestyleMonthly: targetValue,
        lifestyleChanges: current.lifestyleChanges.map((change, index) =>
          index === lastIndex
            ? {
                ...change,
                direction: latestDifference < 0 ? "decrease" : "increase",
                monthlyAmount: String(Math.round(Math.abs(latestDifference))),
              }
            : change,
        ),
      };
    });
  const toggleWealthGoal = (goal: WealthGoal) =>
    setData((current) => ({
      ...current,
      wealthGoals: current.wealthGoals.includes(goal)
        ? current.wealthGoals.filter((item) => item !== goal)
        : [...current.wealthGoals, goal],
      wealthGoalDetails: current.wealthGoalDetails[goal]
        ? current.wealthGoalDetails
        : {
            ...current.wealthGoalDetails,
            [goal]: {
              description: "",
              amount: "",
              targetYear: "",
              priority: "",
              flexibility: "",
            },
          },
    }));
  const updateWealthGoal = (
    goal: WealthGoal,
    patch: Partial<WealthGoalDetail>,
  ) =>
    setData((current) => ({
      ...current,
      wealthGoalDetails: {
        ...current.wealthGoalDetails,
        [goal]: {
          description: "",
          amount: "",
          targetYear: "",
          priority: "",
          flexibility: "",
          ...current.wealthGoalDetails[goal],
          ...patch,
        },
      },
    }));
  const addAction = (category: ActionCategory) =>
    setData((current) => ({
      ...current,
      proposedActions: [
        ...current.proposedActions,
        { id: makeId(), category, description: "", targetDate: "" },
      ],
    }));
  const updateAction = (id: string, patch: Partial<ProposedAction>) =>
    patchData({
      proposedActions: data.proposedActions.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  const reset = () => {
    if (onDelete) { onDelete(); return; }
    track("assessment_deleted", { step });
    setStorageWarning("");
    setData(emptyAssessment);
    setRecovery(null);
    setReturnToFinancialPlan(false);
    go(0);
  };
  const copyActions = async () => {
    try {
      await navigator.clipboard.writeText(
        formatActionsForClipboard(
          blueprint.unaddressedFindings,
          blueprint.actionAssessments,
        ),
      );
      track("next_moves_copied", { step: 11 });
      setCopyStatus("Actions copied");
    } catch {
      setCopyStatus("Could not copy. Please try again.");
    }
  };

  const submitEmail = async () => {
    if (!emailConsent) {
      setEmailStatus("Please confirm that we may contact you by email.");
      return;
    }
    setEmailSubmitting(true);
    setEmailStatus("Saving…");
    try {
      const verifiedCompletionEventId =
        completionEventId ?? (await markMapCompleted());
      if (!completionEventId) {
        setCompletionEventId(verifiedCompletionEventId);
      }
      await submitCompletedMapEmail({
        email: emailAddress,
        submittedAt: Date.now(),
        completionEventId: verifiedCompletionEventId,
      });
      setEmailAddress("");
      setEmailConsent(false);
      setEmailStatus("Thank you. Your email has been saved.");
    } catch {
      setEmailStatus("Your email could not be saved. Please try again.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const sendFeedback = async () => {
    const message = feedbackMessage.trim();
    if (message.length > 400) {
      setFeedbackStatus("Keep your description to 400 characters or fewer.");
      return;
    }
    if (/[0-9₹$€£@]/u.test(message)) {
      setFeedbackStatus(
        "Please remove financial figures, contact details and other personal information.",
      );
      return;
    }
    setFeedbackStatus("Sending…");
    try {
      await submitFeedback({
        step,
        category: feedbackCategory,
        message: message || undefined,
      });
      setFeedbackMessage("");
      setFeedbackStatus("Thank you. Your feedback was sent without your financial answers.");
    } catch {
      setFeedbackStatus("Feedback could not be sent. Please try again.");
    }
  };
  const sendClarityRating = async (rating: ClarityRating) => {
    setClarityRating(rating);
    try {
      await submitFeedback({
        step: 11,
        category: "other",
        clarity: rating,
      });
    } catch {
      setClarityRating("");
    }
  };
  const progress = step > 0 && step < 11 ? Math.round((step / 10) * 100) : 0;

  return (
    <main className="shell">
      <nav className="topbar">
        <button
          className="brand"
          onClick={() => {
            setReturnToFinancialPlan(false);
            go(0);
          }}
        >
          <span>NM</span> NETWORTH MAP
        </button>
        <div className="topbar-actions">
          <div className="privacy-note">
            <i /> <span>Private</span>
          </div>
          <button
            className="report-issue-trigger"
            onClick={() => {
              setFeedbackStatus("");
              feedbackDialogRef.current?.showModal();
            }}
          >
            Report an issue
          </button>
        </div>
      </nav>
      {storageWarning && (
        <p className="storage-warning storage-global" role="status">
          {storageWarning}
        </p>
      )}
      {step > 0 && step < 11 && (
        <div
          className="progress"
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={step}
          aria-valuetext={`${stepNames[step]}, step ${step} of 10`}
        >
          <div>
            <span>{stepNames[step]}</span>
            <small>Step {step} of 10</small>
          </div>
          <i style={{ width: `${progress}%` }} />
        </div>
      )}

      {step === 0 && (
        <NetworthWelcome onBuild={() => setShowQuickStart(true)} />
      )}

      {step > 0 && step < 11 && (
        <section className={`wizard stage-enter step-${step}`}>
          {step === 1 && (
            <>
              <PageHeading
                number="01"
                eyebrow="Blueprint · Earn"
                title="What income do you take home?"
                copy="Enter the personal income you receive before tax. If you own a business, include salary, drawings, dividends and other regular withdrawals—but not business revenue."
              />
              <div className="choice-instruction" id="profile-choice-instruction">
                <span>Select your primary income profile</span>
                <b>Choose one · Required</b>
              </div>
              <p className="profile-choice-guidance" id="profile-choice-guidance">
                Choose the option that best describes how you primarily earn.
              </p>
              <div
                className={`choice-row profile-choice-row${
                  isInvalid("profile", !data.userType) ? " invalid" : ""
                }`}
                role="group"
                data-invalid={isInvalid("profile", !data.userType) || undefined}
                tabIndex={isInvalid("profile", !data.userType) ? -1 : undefined}
                aria-labelledby="profile-choice-instruction"
                aria-describedby={`profile-choice-guidance${
                  isInvalid("profile", !data.userType)
                    ? " profile-choice-error"
                    : ""
                }`}
              >
                <button
                  ref={firstProfileOptionRef}
                  className={data.userType === "founder" ? "selected" : ""}
                  aria-pressed={data.userType === "founder"}
                  onClick={() => {
                    patchData({ userType: "founder" });
                    setError("");
                  }}
                >
                  Founders
                </button>
                <button
                  className={
                    data.userType === "business-owner" ? "selected" : ""
                  }
                  aria-pressed={data.userType === "business-owner"}
                  onClick={() => {
                    patchData({ userType: "business-owner" });
                    setError("");
                  }}
                >
                  Business Owners
                </button>
                <button
                  className={data.userType === "professional" ? "selected" : ""}
                  aria-pressed={data.userType === "professional"}
                  onClick={() => {
                    patchData({ userType: "professional" });
                    setError("");
                  }}
                >
                  Professionals
                </button>
                <button
                  className={data.userType === "salaried" ? "selected" : ""}
                  aria-pressed={data.userType === "salaried"}
                  onClick={() => {
                    patchData({ userType: "salaried" });
                    setError("");
                  }}
                >
                  Salaried
                </button>
              </div>
              {isInvalid("profile", !data.userType) && (
                <p
                  id="profile-choice-error"
                  className="choice-help invalid"
                  role="alert"
                >
                  {PROFILE_REQUIRED_ERROR}
                </p>
              )}
              <div className="form-grid">
                <CurrencyField
                  label={
                    data.userType === "business-owner" ||
                    data.userType === "founder"
                      ? "Annual Personal Income From Your Business"
                      : "Annual Income Before Tax"
                  }
                  value={data.grossPersonalIncome}
                  onChange={(grossPersonalIncome) =>
                    patchData({ grossPersonalIncome })
                  }
                  note="Salary, drawings, dividends and regular personal receipts."
                  invalid={isInvalid("income", !isMoneyValue(data.grossPersonalIncome, true))}
                  errorMessage="Enter your annual income. ₹0 is allowed."
                />
                <label className={`field${isInvalid("tax", data.effectiveTaxRate === "" || numberValue(data.effectiveTaxRate) < 0 || numberValue(data.effectiveTaxRate) > 100) ? " invalid" : ""}`}>
                  <span className="field-heading">
                    <span>Effective Personal Tax Rate</span>
                    <b>Required</b>
                  </span>
                  <div className="currency-input">
                    <input
                      inputMode="decimal"
                      maxLength={6}
                      value={data.effectiveTaxRate}
                      aria-invalid={isInvalid("tax", data.effectiveTaxRate === "" || numberValue(data.effectiveTaxRate) < 0 || numberValue(data.effectiveTaxRate) > 100) || undefined}
                      onChange={(event) =>
                        patchData({
                          effectiveTaxRate: normalizePercentageInput(
                            event.target.value,
                          ),
                        })
                      }
                    />
                    <b>%</b>
                  </div>
                  <input
                    className="amount-slider rate-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={data.effectiveTaxRate || "0"}
                    onChange={(event) => patchData({ effectiveTaxRate: event.target.value })}
                    aria-label="Adjust effective personal tax rate"
                  />
                  <small>A best estimate is sufficient.</small>
                  {isInvalid("tax", data.effectiveTaxRate === "" || numberValue(data.effectiveTaxRate) < 0 || numberValue(data.effectiveTaxRate) > 100) && <small className="field-error" role="alert">Enter a rate from 0% to 100%.</small>}
                </label>
              </div>
              <div className="live-strip">
                <span>Estimated annual income after tax</span>
                <strong>{money.format(blueprint.takeHomeIncome)}</strong>
                <small>Based on the income and tax rate you entered</small>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <PageHeading
                number="02"
                eyebrow="Blueprint · Own"
                title="What do you own?"
                copy="Add your meaningful assets using approximate current values. Include annual income only when an asset currently generates income."
              />
              <LiveNetworthPreview
                totalAssets={blueprint.totalAssets}
                totalLiabilities={blueprint.totalLiabilities}
                networth={blueprint.networth}
              />
              <p className="add-menu-instruction">
                Choose a category to add an asset
              </p>
              <div className="add-menu" aria-label="Asset categories">
                {(Object.keys(assetCategoryLabels) as AssetCategory[]).map(
                  (key) => (
                    <button
                      key={key}
                      className={data.assets.some((asset) => asset.category === key) ? "selected" : ""}
                      onClick={() => addAsset(key)}
                    >
                      + {assetCategoryLabels[key]}
                    </button>
                  ),
                )}
              </div>
              <div className="entry-list">
                {data.assets.map((asset, index) => (
                  <article className={`entry-card asset-entry${isInvalid(`asset-${asset.id}-value`, !isMoneyValue(asset.value)) ? " has-errors" : ""}`} key={asset.id}>
                    <div className="entry-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="entry-fields">
                      <label className="field">
                        <span>Category</span>
                        <select
                          value={asset.category}
                          onChange={(event) =>
                            updateAsset(asset.id, {
                              category: event.target.value as AssetCategory,
                            })
                          }
                        >
                          {Object.entries(assetCategoryLabels).map(
                            ([value, label]) => (
                              <option value={value} key={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <label className="field">
                        <span>Description</span>
                        <input
                          value={asset.description}
                          onChange={(event) =>
                            updateAsset(asset.id, {
                              description: event.target.value,
                            })
                          }
                          placeholder={
                            assetDescriptionPlaceholders[asset.category]
                          }
                        />
                      </label>
                      <CurrencyField
                        label="Current Value"
                        value={asset.value}
                        onChange={(value) => updateAsset(asset.id, { value })}
                        invalid={isInvalid(`asset-${asset.id}-value`, !isMoneyValue(asset.value))}
                        errorMessage="Enter the current value."
                      />
                      <CurrencyField
                        label="Annual Income (if any)"
                        value={asset.annualNetIncome ?? ""}
                        onChange={(annualNetIncome) =>
                          updateAsset(asset.id, { annualNetIncome })
                        }
                        required={false}
                        invalid={isInvalid(`asset-${asset.id}-income`, Boolean(asset.annualNetIncome) && !isMoneyValue(asset.annualNetIncome ?? "", true))}
                        errorMessage="Enter a valid annual income or leave it blank."
                      />
                      <div className="yield-field">
                        <span>Yield</span>
                        <output>
                          {numberValue(asset.value) > 0
                            ? `${(
                                (numberValue(asset.annualNetIncome ?? "") /
                                  numberValue(asset.value)) *
                                100
                              ).toFixed(1)}%`
                            : "—"}
                        </output>
                      </div>
                    </div>
                    <div
                      className="purpose"
                      role="group"
                      aria-labelledby={`asset-purpose-${asset.id}`}
                    >
                      <span
                        className="choice-instruction"
                        id={`asset-purpose-${asset.id}`}
                      >
                        <span>Primary Use</span>
                      </span>
                      <button
                        className={asset.purpose === "investment" ? "selected" : ""}
                        aria-pressed={asset.purpose === "investment"}
                        onClick={() =>
                          updateAsset(asset.id, {
                            purpose:
                              asset.purpose === "investment" ? "" : "investment",
                          })
                        }
                      >
                        Investments
                      </button>
                      <button
                        className={
                          asset.purpose === "personal" ? "selected" : ""
                        }
                        aria-pressed={asset.purpose === "personal"}
                        onClick={() =>
                          updateAsset(asset.id, {
                            purpose:
                              asset.purpose === "personal" ? "" : "personal",
                          })
                        }
                      >
                        Personal / Lifestyle
                      </button>
                    </div>
                    <button
                      className="remove"
                      aria-label="Remove asset"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          assets: current.assets.filter(
                            (item) => item.id !== asset.id,
                          ),
                        }))
                      }
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
              {!!data.assets.length && (
                <div className="add-another-menu">
                  {!showAssetAddMenu ? (
                    <button
                      className="add-another-trigger"
                      onClick={() => setShowAssetAddMenu(true)}
                      aria-expanded={false}
                    >
                      + Add another asset
                    </button>
                  ) : (
                    <>
                      <div className="add-another-heading">
                        <p className="add-menu-instruction">
                          Choose a category to add another asset
                        </p>
                        <button onClick={() => setShowAssetAddMenu(false)}>
                          Cancel
                        </button>
                      </div>
                      <div className="add-menu" aria-label="Add another asset">
                        {(
                          Object.keys(assetCategoryLabels) as AssetCategory[]
                        ).map((key) => (
                          <button
                            key={key}
                            className={data.assets.some((asset) => asset.category === key) ? "selected" : ""}
                            onClick={() => {
                              addAsset(key);
                              setShowAssetAddMenu(false);
                            }}
                          >
                            + {assetCategoryLabels[key]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!data.assets.length && (
              <div className="empty-state">
                  No assets added. You can continue without adding one.
                </div>
              )}
              <div className="running-total">
                <span>Total assets</span>
                <strong>{money.format(blueprint.totalAssets)}</strong>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <PageHeading
                number="03"
                eyebrow="Blueprint · Owe"
                title="What do you owe?"
                copy="Add the amount currently outstanding on each liability. Include a business liability only when you are personally responsible for repaying it."
              />
              <LiveNetworthPreview
                totalAssets={blueprint.totalAssets}
                totalLiabilities={blueprint.totalLiabilities}
                networth={blueprint.networth}
              />
              <p className="add-menu-instruction">
                Choose a liability type to add a debt
              </p>
              <div className="add-menu" aria-label="Liability types">
                {(Object.keys(liabilityTypeLabels) as LiabilityType[]).map(
                  (key) => (
                    <button
                      key={key}
                      className={data.liabilities.some((liability) => liability.type === key) ? "selected" : ""}
                      onClick={() => addLiability(key)}
                    >
                      + {liabilityTypeLabels[key]}
                    </button>
                  ),
                )}
              </div>
              <p className="step-field-guidance">
                Add each debt above, or confirm below that you have no outstanding liabilities. Outstanding Amount is required; Description is optional, and Interest Rate and Annual Repayment may remain at zero.
              </p>
              <div className="entry-list">
                {data.liabilities.map((liability, index) => (
                  <article
                    className={`entry-card liability liability-entry${isInvalid(`liability-${liability.id}-value`, !isMoneyValue(liability.value)) || isInvalid(`liability-${liability.id}-interest`, Boolean(liability.interestRate) && (numberValue(liability.interestRate ?? "") < 0 || numberValue(liability.interestRate ?? "") > 100)) ? " has-errors" : ""}`}
                    key={liability.id}
                  >
                    <div className="entry-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="entry-fields">
                      <label className="field">
                        <span>Category</span>
                        <select
                          value={liability.type}
                          onChange={(event) =>
                            updateLiability(liability.id, {
                              type: event.target.value as LiabilityType,
                            })
                          }
                        >
                          {Object.entries(liabilityTypeLabels).map(
                            ([value, label]) => (
                              <option value={value} key={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <label className="field">
                        <span>Description</span>
                        <input
                          value={liability.description}
                          onChange={(event) =>
                            updateLiability(liability.id, {
                              description: event.target.value,
                            })
                          }
                          placeholder={
                            liabilityDescriptionPlaceholders[liability.type]
                          }
                        />
                      </label>
                      <CurrencyField
                        label="Outstanding Amount"
                        value={liability.value}
                        onChange={(value) =>
                          updateLiability(liability.id, { value })
                        }
                        invalid={isInvalid(`liability-${liability.id}-value`, !isMoneyValue(liability.value))}
                        errorMessage="Enter the outstanding amount."
                      />
                      <label className={`field${isInvalid(`liability-${liability.id}-interest`, Boolean(liability.interestRate) && (numberValue(liability.interestRate ?? "") < 0 || numberValue(liability.interestRate ?? "") > 100)) ? " invalid" : ""}`}>
                        <span>Interest Rate</span>
                        <div className="currency-input interest-rate-input">
                          <input
                            inputMode="decimal"
                            maxLength={6}
                            value={liability.interestRate ?? ""}
                            onChange={(event) =>
                              updateLiability(liability.id, {
                                interestRate: normalizePercentageInput(event.target.value),
                              })
                            }
                            placeholder="0"
                            aria-label="Annual interest rate percentage"
                            aria-invalid={isInvalid(`liability-${liability.id}-interest`, Boolean(liability.interestRate) && (numberValue(liability.interestRate ?? "") < 0 || numberValue(liability.interestRate ?? "") > 100)) || undefined}
                          />
                          <b>%</b>
                        </div>
                        <input
                          className="amount-slider rate-slider"
                          type="range"
                          min="0"
                          max="30"
                          step="0.1"
                          value={liability.interestRate || "0"}
                          onChange={(event) => updateLiability(liability.id, { interestRate: event.target.value })}
                          aria-label={`Adjust interest rate for ${liability.description || `liability ${index + 1}`}`}
                        />
                        {isInvalid(`liability-${liability.id}-interest`, Boolean(liability.interestRate) && (numberValue(liability.interestRate ?? "") < 0 || numberValue(liability.interestRate ?? "") > 100)) && <small className="field-error" role="alert">Enter 0% to 100%, or leave it blank.</small>}
                      </label>
                      <div className="annual-interest-field">
                        <span>Annual Interest</span>
                        <output>
                          {liability.interestRate !== undefined &&
                          liability.interestRate !== "" &&
                          numberValue(liability.value) > 0
                            ? money.format(
                                calculateAnnualInterest(liability),
                              )
                            : "—"}
                        </output>
                      </div>
                      <div className="liability-repayment-field">
                        <CurrencyField
                          label="Annual Repayment"
                          value={liability.annualRepayment ?? "0"}
                          onChange={(annualRepayment) =>
                            updateLiability(liability.id, { annualRepayment })
                          }
                          required={false}
                        />
                        <label
                          className="liability-repayment-checkbox"
                          title="Select this when the repayment is already included in your monthly household costs."
                        >
                          <input
                            type="checkbox"
                            checked={
                              liability.repaymentIncludedInNeeds === true
                            }
                            onChange={(event) =>
                              updateLiability(liability.id, {
                                repaymentIncludedInNeeds: event.target.checked,
                              })
                            }
                          />
                          <span>Included in household costs</span>
                        </label>
                      </div>
                    </div>
                    <div className="purpose">
                      <span>Classification</span>
                      <button
                        className={
                          liability.classification === "personal"
                            ? "selected"
                            : ""
                        }
                        aria-pressed={liability.classification === "personal"}
                        onClick={() =>
                          updateLiability(liability.id, {
                            classification: "personal",
                          })
                        }
                      >
                        Personal
                      </button>
                      <button
                        className={
                          liability.classification === "business"
                            ? "selected"
                            : ""
                        }
                        aria-pressed={liability.classification === "business"}
                        onClick={() =>
                          updateLiability(liability.id, {
                            classification: "business",
                          })
                        }
                      >
                        Business
                      </button>
                    </div>
                    <button
                      className="remove"
                      aria-label="Remove liability"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          liabilities: current.liabilities.filter(
                            (item) => item.id !== liability.id,
                          ),
                        }))
                      }
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
              {!!data.liabilities.length && (
                <div className="add-another-menu">
                  {!showLiabilityAddMenu ? (
                    <button
                      className="add-another-trigger"
                      onClick={() => setShowLiabilityAddMenu(true)}
                      aria-expanded={false}
                    >
                      + Add another liability
                    </button>
                  ) : (
                    <>
                      <div className="add-another-heading">
                        <p className="add-menu-instruction">
                          Choose a type to add another liability
                        </p>
                        <button onClick={() => setShowLiabilityAddMenu(false)}>
                          Cancel
                        </button>
                      </div>
                      <div
                        className="add-menu"
                        aria-label="Add another liability"
                      >
                        {(
                          Object.keys(liabilityTypeLabels) as LiabilityType[]
                        ).map((key) => (
                          <button
                            key={key}
                            className={data.liabilities.some((liability) => liability.type === key) ? "selected" : ""}
                            onClick={() => {
                              addLiability(key);
                              setShowLiabilityAddMenu(false);
                            }}
                          >
                            + {liabilityTypeLabels[key]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!data.liabilities.length && (
                <div className={`zero-liability${isInvalid("liabilities", !data.hasNoLiabilitiesConfirmed) ? " invalid" : ""}`} aria-invalid={isInvalid("liabilities", !data.hasNoLiabilitiesConfirmed) || undefined} tabIndex={isInvalid("liabilities", !data.hasNoLiabilitiesConfirmed) ? -1 : undefined}>
                  <div>
                    <strong>No outstanding liabilities?</strong>
                    <p>
                      If you currently have no liabilities, confirm that below.
                    </p>
                  </div>
                  <button
                    className={data.hasNoLiabilitiesConfirmed ? "selected" : ""}
                    aria-pressed={data.hasNoLiabilitiesConfirmed}
                    onClick={() =>
                      patchData({
                        hasNoLiabilitiesConfirmed:
                          !data.hasNoLiabilitiesConfirmed,
                      })
                    }
                  >
                    {data.hasNoLiabilitiesConfirmed ? "✓ " : ""}I currently
                    have no outstanding liabilities
                  </button>
                  {isInvalid("liabilities", !data.hasNoLiabilitiesConfirmed) && <small className="field-error" role="alert">Add a liability or confirm that you currently have none.</small>}
                </div>
              )}
              <div className="running-total">
                <span>Total liabilities</span>
                <strong>{money.format(blueprint.totalLiabilities)}</strong>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <PageHeading
                number="04"
                eyebrow="Blueprint · Spend"
                title="What does your life cost?"
                copy="Use your best monthly estimates. Separate the essential costs that keep your household running from the discretionary spending that shapes your lifestyle."
              />
              <div className="spend-grid">
                <article>
                  <div className="tile-icon">◇</div>
                  <p className="eyebrow">Needs</p>
                  <h2>Essential Household Costs</h2>
                  <p>
                    Housing, food, utilities, transport, healthcare, insurance,
                    education and essential maintenance.
                  </p>
                  <CurrencyField
                    label="Average Monthly Needs"
                    value={data.monthlyNeeds}
                    onChange={(monthlyNeeds) => patchData({ monthlyNeeds })}
                    invalid={isInvalid("monthly-needs", !isMoneyValue(data.monthlyNeeds))}
                    errorMessage="Enter your monthly essential costs."
                  />
                </article>
                <article>
                  <div className="tile-icon">✦</div>
                  <p className="eyebrow">Wants</p>
                  <h2>Lifestyle Spending</h2>
                  <p>
                    Dining, travel, entertainment, hobbies, memberships,
                    clothing and discretionary purchases.
                  </p>
                  <CurrencyField
                    label="Average Monthly Wants"
                    value={data.monthlyWants}
                    onChange={(monthlyWants) => patchData({ monthlyWants })}
                    invalid={isInvalid("monthly-wants", !isMoneyValue(data.monthlyWants, true))}
                    errorMessage="Enter your monthly wants, or ₹0."
                  />
                </article>
              </div>
              <div className="live-strip">
                <span>Annual lifestyle cost</span>
                <strong>
                  {money.format(blueprint.currentLifestyle)} / year
                </strong>
                <small>
                  Needs {money.format(blueprint.annualNeeds)} + Wants{" "}
                  {money.format(blueprint.annualWants)}
                </small>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <PageHeading
                number="05"
                eyebrow="Blueprint · Invest"
                title="How much do you invest each year?"
                copy="Enter how much you invest each year. Use ₹0 if you do not currently invest."
              />
              <div className="focus-field investing-focus-field">
                <CurrencyField
                  label="Typical Annual Investing"
                  value={data.annualInvesting}
                  onChange={(annualInvesting) => patchData({ annualInvesting })}
                  note="Include recurring contributions to investment assets. Enter ₹0 if you are not currently investing."
                  invalid={isInvalid("annual-investing", !isMoneyValue(data.annualInvesting, true))}
                  errorMessage="Enter annual investing, or ₹0."
                />
              </div>
              <div
                className={`equation repayment-equation${
                  !showDebtRepaymentStatus
                    ? " no-debt-repayment"
                    : ""
                }`}
              >
                <div>
                  <span>Take-home</span>
                  <strong>{money.format(blueprint.takeHomeIncome)}</strong>
                </div>
                <i>−</i>
                <div>
                  <span>Lifestyle</span>
                  <strong>{money.format(blueprint.currentLifestyle)}</strong>
                </div>
                {showDebtRepaymentStatus && (
                  <>
                    <i>{debtRepaymentAlreadyCounted ? "•" : "−"}</i>
                    <div>
                      <span>
                        {debtRepaymentAlreadyCounted
                          ? "Debt repayment already counted in your household costs"
                          : "Annual debt repayment"}
                      </span>
                      {!debtRepaymentAlreadyCounted && (
                        <strong>
                          {money.format(blueprint.annualDebtRepaymentDeducted)}
                        </strong>
                      )}
                    </div>
                  </>
                )}
                <i>=</i>
                <div>
                  <span>{surplusLabel}</span>
                  <strong>{money.format(blueprint.availableSurplus)}</strong>
                </div>
                <i>−</i>
                <div>
                  <span>Actual investing</span>
                  <strong>{money.format(blueprint.annualInvesting)}</strong>
                </div>
                <i>=</i>
                <div>
                  <span>Liquidity</span>
                  <strong>{money.format(blueprint.cashAfterInvesting)}</strong>
                </div>
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <header className="page-heading">
                <span>06</span>
                <div>
                  <p className="eyebrow">Blueprint reveal</p>
                  <h1>Your financial life, in one place</h1>
                </div>
              </header>
              <div className="blueprint-grid financial-headlines">
                <Metric
                  label="Current Net Worth"
                  value={money.format(blueprint.networth)}
                  featured
                />
                <Metric
                  label="Total Assets"
                  value={money.format(blueprint.totalAssets)}
                />
                <Metric
                  label="Total Liabilities"
                  value={money.format(blueprint.totalLiabilities)}
                />
              </div>
              <details
                className="financial-breakdown"
                open
                onToggle={() => track("breakdown_toggled", { step: 6 })}
              >
                <summary>
                  See full breakdown <span aria-hidden="true">＋</span>
                </summary>
                <div>
                  <p className="financial-breakdown-intro">
                    Look beyond your headline net worth and review how your
                    income, assets, liabilities, spending and investing fit
                    together. Correct anything that does not look right before
                    defining your Vision.
                  </p>
                  <div className="networth-summary">
                <Metric
                  label="Current Net Worth"
                  value={money.format(blueprint.networth)}
                  detail={
                    blueprint.totalAssets > 0
                      ? `${metricPercent(percentageOf(blueprint.networth, blueprint.totalAssets))} of asset value remains net`
                      : "No asset value entered"
                  }
                  question={`If ${questionMoney(blueprint.networth)} had one job for three years, what would it be?`}
                  featured
                />
                  </div>
              <section
                className="income-reveal"
                aria-label="Assets analysis"
              >
                <header>
                  <span>Assets</span>
                  <small>What you own and what it currently produces</small>
                </header>
                <div>
                  <Metric
                    label="Total Assets"
                    value={money.format(blueprint.totalAssets)}
                    detail={
                      blueprint.largestAsset
                        ? `${blueprint.largestAsset.description.trim() || assetCategoryLabels[blueprint.largestAsset.category]} is ${blueprint.largestAssetPercent.toFixed(0)}% of assets`
                        : "No assets entered"
                    }
                    question={
                      blueprint.largestAsset
                        ? `Would ${blueprint.largestAssetPercent.toFixed(0)}% in ${compactLabel(blueprint.largestAsset.description.trim() || assetCategoryLabels[blueprint.largestAsset.category])} meet your liquidity needs in a downturn?`
                        : "Which first asset would strengthen your financial foundation?"
                    }
                  />
                  <Metric
                    label="Investment Assets"
                    value={money.format(blueprint.wealthAssets)}
                    detail={
                      unclassifiedAssetCount
                        ? `${unclassifiedAssetCount} asset${unclassifiedAssetCount === 1 ? " is" : "s are"} not classified`
                        : `${blueprint.wealthAssetPercent.toFixed(0)}% of assets are invested`
                    }
                    question={
                      unclassifiedAssetCount
                        ? "Classify primary use to improve this insight."
                        : `Does ${blueprint.wealthAssetPercent.toFixed(0)}% invested match your goals, horizon and risk capacity?`
                    }
                  />
                  <Metric
                    label="Annual Asset Income"
                    value={money.format(blueprint.totalAssetIncome)}
                    detail={`${money.format(blueprint.totalAssetIncome / 12)} per month`}
                    question={
                      blueprint.totalAssetIncome > 0
                        ? `Does ${monthlyQuestionMoney(blueprint.totalAssetIncome / 12)} fit your need for income versus growth?`
                        : "Does prioritising growth over current asset income fit your goals?"
                    }
                  />
                  <Metric
                    label="Accessible Assets"
                    value={compactMoney(blueprint.accessibleAssets)}
                    detail={
                      blueprint.accessibleMonths === null
                        ? "Coverage not available"
                        : `${blueprint.accessibleMonths.toFixed(0)} months of current lifestyle`
                    }
                    question={
                      blueprint.accessibleMonths === null
                        ? "Which asset could become dependable, accessible liquidity?"
                        : blueprint.accessibleMonths < 12
                          ? `Would ${blueprint.accessibleMonths.toFixed(0)} months cover your obligations through an income shock?`
                          : `Does holding ${blueprint.accessibleMonths.toFixed(0)} months accessible fit your near-term needs?`
                    }
                  />
                </div>
              </section>
              <section
                className="income-reveal"
                aria-label="Liabilities analysis"
              >
                <header>
                  <span>Liabilities</span>
                  <small>What you owe and its estimated annual cost</small>
                </header>
                <div>
                  <Metric
                    label="Total Liabilities"
                    value={money.format(blueprint.totalLiabilities)}
                    detail={
                      blueprint.takeHomeIncome > 0
                        ? `${(blueprint.totalLiabilities / blueprint.takeHomeIncome).toFixed(1)}× annual income after tax`
                        : "Income comparison not available"
                    }
                    question={
                      blueprint.takeHomeIncome > 0
                        ? `Which debt comes first after cost, tax and liquidity are weighed?`
                        : "Which liability costs the most without building value?"
                    }
                  />
                  <Metric
                    label="Annual Interest Paid"
                    value={money.format(blueprint.totalAnnualInterest)}
                    detail={
                      blueprint.totalAnnualInterest > 0
                        ? `${money.format(blueprint.totalAnnualInterest / 12)} per month`
                        : "No annual interest entered"
                    }
                    question={
                      blueprint.totalAnnualInterest > 0
                        ? `Would repaying debt be the best use of ${monthlyQuestionMoney(blueprint.totalAnnualInterest / 12)}?`
                        : "Have you captured every interest rate before deciding?"
                    }
                  />
                  <Metric
                    label="Debt / Assets"
                    value={
                      blueprint.totalAssets > 0
                        ? metricPercent(blueprint.debtPercent)
                        : "Not Available"
                    }
                    detail={
                      blueprint.totalLiabilities === 0
                        ? "No liabilities to cover"
                        : blueprint.totalAssets > 0
                          ? `Assets cover debt ${(blueprint.totalAssets / blueprint.totalLiabilities).toFixed(1)}×`
                          : "Coverage not available"
                    }
                    question={
                      blueprint.totalLiabilities > 0
                        ? `After a 20% asset fall, would ${((blueprint.totalAssets * 0.8) / blueprint.totalLiabilities).toFixed(1)}× cover still feel resilient?`
                        : "What opportunity would justify taking on debt again?"
                    }
                  />
                  <Metric
                    label="Interest Covered by Asset Income"
                    value={
                      blueprint.totalAnnualInterest === 0
                        ? "Not Applicable"
                        : metricPercent(blueprint.assetIncomeInterestCoverage)
                    }
                    detail={
                      blueprint.totalAnnualInterest === 0
                        ? "No interest to cover"
                        : blueprint.totalAssetIncome >=
                            blueprint.totalAnnualInterest
                          ? `${money.format(blueprint.totalAssetIncome - blueprint.totalAnnualInterest)} asset income remains`
                          : `${money.format(blueprint.totalAnnualInterest - blueprint.totalAssetIncome)} interest remains uncovered`
                    }
                    question={
                      blueprint.totalAnnualInterest === 0
                        ? "Have you captured every interest rate before deciding?"
                        : blueprint.totalAssetIncome >=
                            blueprint.totalAnnualInterest
                          ? `Should ${questionMoney(blueprint.totalAssetIncome - blueprint.totalAnnualInterest)} reduce debt or fund a higher-priority goal?`
                          : `Is earned income the best source for the ${questionMoney(blueprint.totalAnnualInterest - blueprint.totalAssetIncome)} shortfall?`
                    }
                  />
                </div>
              </section>
              <section
                className="income-reveal key-ratios"
                aria-label="Assets and liabilities key ratios"
              >
                <header>
                  <span>Assets &amp; Liabilities · Key Ratios</span>
                  <small>How what you own relates to what you owe</small>
                </header>
                <div>
                  <Metric
                    label="Investment Share"
                    value={metricPercent(blueprint.wealthAssetPercent)}
                    detail={`${blueprint.wealthAssetPercent.toFixed(0)}% of assets are invested`}
                    question={`What investment share fits your goals, horizon and risk capacity?`}
                  />
                  <Metric
                    label="Income Yield"
                    value={metricPercent(blueprint.assetIncomeYield)}
                    detail={
                      blueprint.assetIncomeYield === null
                        ? "No asset income reported"
                        : "Yield on income-producing assets"
                    }
                    question={
                      blueprint.assetIncomeYield === null
                        ? "Do you need asset income now, or is growth the priority?"
                        : blueprint.assetIncomeYield < 3
                          ? `Does ${blueprint.assetIncomeYield.toFixed(1)}% justify the asset’s cost, risk and liquidity?`
                          : blueprint.assetIncomeYield < 6
                            ? `Is ${blueprint.assetIncomeYield.toFixed(1)}% appropriate for the risk and liquidity involved?`
                            : `Is ${blueprint.assetIncomeYield.toFixed(1)}% sustainable after costs, tax and risk?`
                    }
                  />
                  <Metric
                    label="Asset Cover"
                    value={
                      blueprint.totalLiabilities > 0
                        ? `${(blueprint.totalAssets / blueprint.totalLiabilities).toFixed(1)}×`
                        : "Not Applicable"
                    }
                    detail={
                      blueprint.totalLiabilities > 0
                        ? `${blueprint.debtPercent.toFixed(1)}% debt-to-assets`
                        : "No liabilities to cover"
                    }
                    question={
                      blueprint.totalLiabilities > 0
                        ? `Which assets would actually repay debt in a stressed year?`
                        : "What opportunity would justify taking on debt again?"
                    }
                  />
                  <Metric
                    label="Interest Coverage"
                    value={metricPercent(blueprint.assetIncomeInterestCoverage)}
                    detail={
                      blueprint.totalAnnualInterest === 0
                        ? "No annual interest entered"
                        : (blueprint.assetIncomeInterestCoverage ?? 0) >= 100
                          ? "Asset income covers annual interest"
                          : "Asset income leaves a shortfall"
                    }
                    question={
                      blueprint.totalAnnualInterest === 0
                        ? "Have you captured every interest rate before deciding?"
                        : (blueprint.assetIncomeInterestCoverage ?? 0) >= 100
                          ? `How durable is ${metricPercent(blueprint.assetIncomeInterestCoverage)} coverage if income falls?`
                          : `What changes first to close the ${metricPercent(100 - (blueprint.assetIncomeInterestCoverage ?? 0))} coverage gap?`
                    }
                  />
                </div>
              </section>
              <section className="income-reveal" aria-label="Income analysis">
                <header>
                  <span>Income</span>
                  <small>Personal income only; excludes business revenue</small>
                </header>
                <div>
                  <Metric
                    label="Income Before Tax"
                    value={money.format(numberValue(data.grossPersonalIncome))}
                    detail={`${money.format(numberValue(data.grossPersonalIncome) / 12)} per month`}
                    question={`What protects your plan if ${monthlyQuestionMoney(numberValue(data.grossPersonalIncome) / 12)} stops?`}
                  />
                  <Metric
                    label="Income After Tax"
                    value={money.format(blueprint.takeHomeIncome)}
                    detail={`${data.effectiveTaxRate || "0"}% effective tax rate`}
                    question={`Is the ${data.effectiveTaxRate || "0"}% tax assumption verified and complete?`}
                  />
                  <Metric
                    label="Annual Investing"
                    value={money.format(blueprint.annualInvesting)}
                    detail={
                      blueprint.takeHomeIncome > 0
                        ? `${metricPercent(blueprint.investingRate)} of income after tax`
                        : "Investing rate not available"
                    }
                    question={investingQuestion(blueprint.investingRate)}
                  />
                  <Metric
                    label={surplusLabel}
                    value={money.format(blueprint.availableSurplus)}
                    context={
                      debtRepaymentAlreadyCounted
                        ? "Debt repayment already counted in your household costs"
                        : blueprint.annualDebtRepaymentDeducted > 0
                          ? `Annual debt repayment ${money.format(blueprint.annualDebtRepaymentDeducted)}`
                          : undefined
                    }
                    detail={`${metricPercent(percentageOf(blueprint.availableSurplus, blueprint.takeHomeIncome))} of income after tax remains`}
                    question={
                      blueprint.availableSurplus >= 0
                        ? `Is ${questionMoney(blueprint.availableSurplus)} best used for debt, liquidity or investing?`
                        : `What must change first to close the ${questionMoney(Math.abs(blueprint.availableSurplus))} gap?`
                    }
                  />
                </div>
              </section>
              <section className="income-reveal" aria-label="Expenses analysis">
                <header>
                  <span>Expenses</span>
                  <small>Annual needs, wants and remaining cash</small>
                </header>
                <div>
                  <Metric
                    label="Annual Needs"
                    value={money.format(blueprint.annualNeeds)}
                    detail={`${metricPercent(percentageOf(blueprint.annualNeeds, blueprint.currentLifestyle))} of lifestyle cost is essential`}
                    question={`Which part of ${questionMoney(blueprint.annualNeeds)} would be hardest to protect in a shock?`}
                  />
                  <Metric
                    label="Annual Wants"
                    value={money.format(blueprint.annualWants)}
                    detail={`${metricPercent(percentageOf(blueprint.annualWants, blueprint.currentLifestyle))} of lifestyle cost is discretionary`}
                    question={`Which part of ${questionMoney(blueprint.annualWants)} adds enough value to keep?`}
                  />
                  <Metric
                    label="Annual Lifestyle Cost"
                    value={money.format(blueprint.currentLifestyle)}
                    detail={
                      blueprint.lifestyleCostShareOfTakeHome === null
                        ? "Share not available"
                        : `${metricPercent(blueprint.lifestyleCostShareOfTakeHome)} of income after tax`
                    }
                    question={`If income fell 20%, what within ${questionMoney(blueprint.currentLifestyle)} would you protect first?`}
                  />
                  <Metric
                    label={
                      blueprint.cashAfterInvesting < 0
                        ? "Funding Gap After Investing"
                        : "Unallocated Cash"
                    }
                    value={money.format(blueprint.cashAfterInvesting)}
                    detail={
                      blueprint.cashAfterInvesting < 0
                        ? "Investing exceeds available surplus"
                        : "Available after lifestyle and investing"
                    }
                    question={
                      blueprint.cashAfterInvesting < 0
                        ? `Which commitment changes first to close the ${questionMoney(Math.abs(blueprint.cashAfterInvesting))} gap?`
                        : `Which goal is the best use of ${questionMoney(blueprint.cashAfterInvesting)}?`
                    }
                  />
                </div>
              </section>
              <section
                className="income-reveal key-ratios"
                aria-label="Income and expenses key ratios"
              >
                <header>
                  <span>Income &amp; Expenses · Key Ratios</span>
                  <small>How income supports lifestyle and future choices</small>
                </header>
                <div>
                  <Metric
                    label="Asset Income Share"
                    value={metricPercent(
                      percentageOf(
                        blueprint.totalAssetIncome,
                        blueprint.takeHomeIncome + blueprint.totalAssetIncome,
                      ),
                    )}
                    detail={`${metricPercent(percentageOf(blueprint.totalAssetIncome, blueprint.takeHomeIncome + blueprint.totalAssetIncome))} of combined income comes from assets`}
                    question={
                      blueprint.totalAssetIncome === 0
                        ? "When should assets begin reducing reliance on earned income?"
                        : `What should the ${metricPercent(percentageOf(blueprint.totalAssetIncome, blueprint.takeHomeIncome + blueprint.totalAssetIncome))} asset-income share become in five years?`
                    }
                  />
                  <Metric
                    label="Interest Burden"
                    value={metricPercent(
                      percentageOf(
                        blueprint.totalAnnualInterest,
                        blueprint.takeHomeIncome,
                      ),
                    )}
                    detail={
                      blueprint.totalAnnualInterest === 0
                        ? "No annual interest entered"
                        : `${metricPercent(percentageOf(blueprint.totalAnnualInterest, blueprint.takeHomeIncome))} of income after tax goes to interest`
                    }
                    question={
                      blueprint.totalAnnualInterest === 0
                        ? "Have you captured every interest rate before deciding?"
                        : blueprint.takeHomeIncome <= 0
                          ? "Which debt cost should be addressed first?"
                        : `Which repayment cuts the ${metricPercent(percentageOf(blueprint.totalAnnualInterest, blueprint.takeHomeIncome))} interest burden fastest?`
                    }
                  />
                  <Metric
                    label="Lifestyle Load"
                    value={metricPercent(
                      blueprint.lifestyleCostShareOfTakeHome,
                    )}
                    detail={`${metricPercent(blueprint.lifestyleCostShareOfTakeHome)} of income after tax supports lifestyle`}
                    question={
                      blueprint.lifestyleCostShareOfTakeHome === null
                        ? "What income would sustainably support this lifestyle?"
                        : `At ${metricPercent(blueprint.lifestyleCostShareOfTakeHome)}, how much room remains for goals and shocks?`
                    }
                  />
                  <Metric
                    label="Free Cash Rate"
                    value={metricPercent(
                      percentageOf(
                        blueprint.cashAfterInvesting,
                        blueprint.takeHomeIncome,
                      ),
                    )}
                    detail={
                      blueprint.cashAfterInvesting < 0
                        ? "Cash flow is negative after investing"
                        : `${metricPercent(percentageOf(blueprint.cashAfterInvesting, blueprint.takeHomeIncome))} remains after investing`
                    }
                    question={
                      blueprint.takeHomeIncome <= 0
                        ? blueprint.cashAfterInvesting < 0
                          ? `Which choice closes the ${questionMoney(Math.abs(blueprint.cashAfterInvesting))} cash deficit first?`
                          : `Which goal earns first claim on ${questionMoney(blueprint.cashAfterInvesting)}?`
                        : blueprint.cashAfterInvesting < 0
                        ? `Which choice closes the ${metricPercent(Math.abs(percentageOf(blueprint.cashAfterInvesting, blueprint.takeHomeIncome) ?? 0))} cash deficit first?`
                        : `Which goal earns first claim on ${metricPercent(percentageOf(blueprint.cashAfterInvesting, blueprint.takeHomeIncome))} free cash?`
                    }
                  />
                </div>
              </section>
              <div className="review-links">
                <button onClick={() => editFromFinancialPlan(1)}>
                  Edit income
                </button>
                <button onClick={() => editFromFinancialPlan(2)}>
                  Edit assets
                </button>
                <button onClick={() => editFromFinancialPlan(3)}>
                  Edit liabilities
                </button>
                <button onClick={() => editFromFinancialPlan(4)}>
                  Edit spending
                </button>
                <button onClick={() => editFromFinancialPlan(5)}>
                  Edit investing
                </button>
              </div>
              <p className="disclaimer">
                These results are based on the information and estimates you
                provided. Asset roles describe how you currently use each
                asset; they do not predict future value, income or returns.
              </p>
                </div>
              </details>
            </>
          )}

          {step === 7 && (
            <>
              <PageHeading
                number="07"
                eyebrow="Vision · Lifestyle · 1 of 3"
                title="What should your wealth make possible every month?"
                copy="First define the life your wealth should sustain—the recurring cost of feeling secure, independent or free."
              />
              <div className="choice-instruction" id="vision-choice-instruction">
                <span>Choose one</span>
                <b>Required</b>
              </div>
              <div className={`vision-cards${isInvalid("vision", !data.visionLevel || !data.visionChoiceConfirmed) ? " invalid" : ""}`} data-invalid={isInvalid("vision", !data.visionLevel || !data.visionChoiceConfirmed) || undefined} tabIndex={isInvalid("vision", !data.visionLevel || !data.visionChoiceConfirmed) ? -1 : undefined}>
                {(
                  [
                    [
                      "security",
                      "◇",
                      "Financial Security",
                      "Cover the essentials",
                      blueprint.annualNeeds,
                    ],
                    [
                      "independence",
                      "◈",
                      "Financial Independence",
                      "Maintain the life I live today",
                      blueprint.currentLifestyle,
                    ],
                    [
                      "freedom",
                      "✦",
                      "Financial Freedom",
                      "Create room for a bigger life",
                      blueprint.visionAnnualCost,
                    ],
                  ] as [VisionLevel, string, string, string, number][]
                ).map(([value, icon, title, copy, amount]) => (
                  <div
                    className={`vision-card-shell${value === "freedom" && data.visionLevel === "freedom" ? " freedom-selected" : ""}`}
                    key={value}
                  >
                    <button
                      className={data.visionLevel === value ? "selected" : ""}
                      aria-pressed={data.visionLevel === value}
                      onClick={() => {
                        patchData({
                          visionLevel: value,
                          visionChoiceConfirmed: true,
                        });
                        setError("");
                      }}
                    >
                      <i>{icon}</i>
                      <span>{title}</span>
                      <strong>{copy}</strong>
                      <small>
                        {value === "freedom" &&
                        !numberValue(data.desiredLifestyleMonthly)
                          ? "Define Your Freedom"
                          : `${money.format(amount)} / year`}
                      </small>
                    </button>
                    {value === "freedom" && data.visionLevel === "freedom" && (
                      <label
                        className="freedom-card-slider"
                      >
                        <input
                          className="amount-slider"
                          type="range"
                          min={blueprint.currentLifestyle}
                          max={Math.max(
                            6_000_000,
                            blueprint.currentLifestyle + 6_000_000,
                            blueprint.currentLifestyle * 3,
                            numberValue(data.desiredLifestyleMonthly) * 12 * 1.25,
                            blueprint.visionAnnualCost * 1.25,
                          )}
                          step="120000"
                          value={blueprint.visionAnnualCost}
                          onChange={(event) =>
                            updateDesiredLifestyle(
                              String(numberValue(event.target.value) / 12),
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              {isInvalid("vision", !data.visionLevel || !data.visionChoiceConfirmed) && <p className="field-error" role="alert">Choose one Vision to continue.</p>}
              {!!data.visionLevel && (
                <section className="vision-lifestyle-field">
                  <header>
                    <div>
                      <span>Desired Lifestyle</span>
                      <strong>What would change from life today?</strong>
                    </div>
                    <div className="lifestyle-total">
                      <span>Desired monthly lifestyle</span>
                      <strong>{money.format(blueprint.visionAnnualCost / 12)}</strong>
                      <small>
                        Today: {money.format(blueprint.currentLifestyle / 12)}
                      </small>
                    </div>
                  </header>
                  <p className="lifestyle-guidance">
                    Add recurring changes only. A car purchase belongs under
                    Goals; its fuel, insurance and maintenance belong here.
                  </p>
                  <div
                    className="lifestyle-categories"
                    aria-label="Add a recurring lifestyle change"
                  >
                    {lifestyleCategoryOptions.map((category) => (
                      <button
                        key={category}
                        className={data.lifestyleChanges.some((change) => change.category === category) ? "selected" : ""}
                        onClick={() => addLifestyleChange(category)}
                      >
                        + {lifestyleCategoryLabels[category]}
                      </button>
                    ))}
                  </div>
                  {!!data.lifestyleChanges.length && (
                    <div className="lifestyle-change-list">
                      {data.lifestyleChanges.map((change, index) => (
                        <article key={change.id}>
                          <b>{String(index + 1).padStart(2, "0")}</b>
                          <label className="field">
                            <span>Details</span>
                            <input
                              value={change.description}
                              maxLength={100}
                              placeholder={lifestyleCategoryLabels[change.category]}
                              onChange={(event) =>
                                updateLifestyleChange(change.id, {
                                  description: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Effect</span>
                            <select
                              value={change.direction}
                              onChange={(event) =>
                                updateLifestyleChange(change.id, {
                                  direction: event.target.value as
                                    | "increase"
                                    | "decrease",
                                })
                              }
                            >
                              <option value="increase">Increase</option>
                              <option value="decrease">Decrease</option>
                            </select>
                          </label>
                          <CurrencyField
                            label="Monthly Difference"
                            value={change.monthlyAmount}
                            onChange={(monthlyAmount) =>
                              updateLifestyleChange(change.id, { monthlyAmount })
                            }
                            invalid={isInvalid(`lifestyle-${change.id}-amount`, !isMoneyValue(change.monthlyAmount))}
                            errorMessage="Enter the monthly difference."
                          />
                          <label className={`field${isInvalid(`lifestyle-${change.id}-date`, !isValidIsoDate(change.startDate) || change.startDate < localIsoDate()) ? " invalid" : ""}`}>
                            <span className="field-heading">
                              <span>Starts On</span>
                              <b>Required</b>
                            </span>
                            <input
                              type="date"
                              value={change.startDate}
                              min={localIsoDate()}
                              max={`${new Date().getFullYear() + 100}-12-31`}
                              aria-invalid={isInvalid(`lifestyle-${change.id}-date`, !isValidIsoDate(change.startDate) || change.startDate < localIsoDate()) || undefined}
                              onChange={(event) =>
                                updateLifestyleChange(change.id, {
                                  startDate: event.target.value,
                                })
                              }
                            />
                            {isInvalid(`lifestyle-${change.id}-date`, !isValidIsoDate(change.startDate) || change.startDate < localIsoDate()) && <small className="field-error" role="alert">Choose a valid future start date.</small>}
                          </label>
                          <button
                            className="remove"
                            aria-label={`Remove lifestyle change ${index + 1}`}
                            onClick={() =>
                              setData((current) => ({
                                ...current,
                                lifestyleChanges:
                                  current.lifestyleChanges.filter(
                                    (item) => item.id !== change.id,
                                  ),
                              }))
                            }
                          >
                            ×
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="lifestyle-equation" aria-label="Desired lifestyle calculation">
                    <div>
                      <span>Current Lifestyle</span>
                      <strong>{money.format(blueprint.currentLifestyle / 12)}</strong>
                    </div>
                    <i>{totalLifestyleChange < 0 ? "−" : "+"}</i>
                    <div>
                      <span>Planned Changes</span>
                      <strong>{money.format(Math.abs(totalLifestyleChange))}</strong>
                    </div>
                    <i>=</i>
                    <div className="desired-result">
                      <span>Desired Lifestyle</span>
                      <strong>{money.format(blueprint.visionAnnualCost / 12)}</strong>
                    </div>
                    {data.visionLevel === "security" &&
                      numberValue(data.monthlyWants) > 0 && (
                        <small>
                          This includes reducing {money.format(numberValue(data.monthlyWants))} of monthly Wants. Which costs would change first?
                        </small>
                      )}
                  </div>
                </section>
              )}
            </>
          )}

          {step === 8 && (
            <>
              <PageHeading
                number="08"
                eyebrow="Vision · Life Goals · 2 of 3"
                title="What should your wealth achieve?"
                copy="Choose your goals, then add an amount, target year and importance."
              />
              <div className="choice-instruction">
                <span>Choose all that matter</span>
                <b>At least one required</b>
              </div>
              <div
                className={`wealth-goals${isInvalid("goals", !data.wealthGoals.length) ? " invalid" : ""}`}
                role="group"
                aria-label="Specific wealth goals"
                data-invalid={isInvalid("goals", !data.wealthGoals.length) || undefined}
                tabIndex={isInvalid("goals", !data.wealthGoals.length) ? -1 : undefined}
              >
                {(Object.keys(wealthGoalLabels) as WealthGoal[]).map((goal) => (
                  <button
                    key={goal}
                    className={data.wealthGoals.includes(goal) ? "selected" : ""}
                    aria-pressed={data.wealthGoals.includes(goal)}
                    onClick={() => {
                      toggleWealthGoal(goal);
                      setError("");
                    }}
                  >
                    {data.wealthGoals.includes(goal) ? "✓ " : "+ "}
                    {wealthGoalLabels[goal]}
                  </button>
                ))}
              </div>
              {isInvalid("goals", !data.wealthGoals.length) && <p className="field-error" role="alert">Choose at least one goal.</p>}
              {!!data.wealthGoals.length && (
                <div className="wealth-goal-list">
                  <div className="wealth-goal-list-heading">
                    <strong>Define each goal</strong>
                    <span>
                      {data.wealthGoals.length > 1
                        ? "If money is limited, which goal takes priority?"
                        : "Set how important this goal is."}
                    </span>
                  </div>
                  {data.wealthGoals.map((goal) => {
                    const detail = data.wealthGoalDetails[goal] ?? {
                      description: "",
                      amount: "",
                      targetYear: "",
                      priority: "",
                      flexibility: "",
                    };
                    return (
                      <article className={invalidFields.some((field) => field.startsWith(`goal-${goal}-`)) ? "has-errors" : ""} key={goal}>
                        <div className="wealth-goal-name">
                          <span>Category</span>
                          <strong>{wealthGoalLabels[goal]}</strong>
                        </div>
                        <label className="field wealth-goal-description">
                          <span className="field-heading">
                            <span>Description</span>
                          </span>
                          <input
                            value={detail.description}
                            maxLength={100}
                            placeholder="Describe your specific goal"
                            aria-label={`Describe ${wealthGoalLabels[goal]}`}
                            onChange={(event) =>
                              updateWealthGoal(goal, {
                                description: event.target.value,
                              })
                            }
                          />
                        </label>
                        <CurrencyField
                          label="Amount"
                          value={detail.amount}
                          onChange={(amount) =>
                            updateWealthGoal(goal, { amount })
                          }
                          invalid={isInvalid(`goal-${goal}-amount`, !isMoneyValue(detail.amount))}
                          errorMessage="Enter the amount required today."
                        />
                        <label className={`field${isInvalid(`goal-${goal}-year`, !!detail.targetYear && (numberValue(detail.targetYear) <= new Date().getFullYear() || numberValue(detail.targetYear) > new Date().getFullYear() + 100)) ? " invalid" : ""}`}>
                          <span className="field-heading">
                            <span>Target Year</span>
                          </span>
                          <input
                            inputMode="numeric"
                            maxLength={4}
                            value={detail.targetYear}
                            placeholder={String(new Date().getFullYear() + 5)}
                            aria-invalid={isInvalid(`goal-${goal}-year`, !!detail.targetYear && (numberValue(detail.targetYear) <= new Date().getFullYear() || numberValue(detail.targetYear) > new Date().getFullYear() + 100)) || undefined}
                            onChange={(event) =>
                              updateWealthGoal(goal, {
                                targetYear: rawNumber(event.target.value),
                              })
                            }
                          />
                          {isInvalid(`goal-${goal}-year`, !!detail.targetYear && (numberValue(detail.targetYear) <= new Date().getFullYear() || numberValue(detail.targetYear) > new Date().getFullYear() + 100)) && <small className="field-error" role="alert">Enter a future year.</small>}
                        </label>
                        <label className="field wealth-goal-priority">
                          <span className="field-heading">
                            <span>Importance</span>
                          </span>
                          <select
                            value={detail.priority}
                            onChange={(event) =>
                              updateWealthGoal(goal, {
                                priority: event.target
                                  .value as WealthGoalDetail["priority"],
                              })
                            }
                          >
                            <option value="">Choose one</option>
                            <option value="must">Non-negotiable</option>
                            <option value="important">Important</option>
                            <option value="aspirational">Aspirational</option>
                          </select>
                        </label>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 9 && (
            <>
              <PageHeading
                number="09"
                eyebrow="Vision · Personal Aspiration · 3 of 3"
                title="What does the life you dream of look like?"
                copy="Describe that life first. Then decide whether a financial milestone would help and name why this life matters to you."
              />
              <div className="milestone-prompt">
                <strong>Do you have a wealth milestone in mind?</strong>
                <span>A financial milestone turns the life you imagined into something you can work toward. You can define it later if you are not ready today.</span>
                <b>Choose one · Required</b>
              </div>
              <div
                className={`choice-row milestone-choice-row${isInvalid("milestone-choice", !data.wealthMilestoneChoice) ? " invalid" : ""}`}
                role="group"
                aria-label="Personal wealth milestone"
                data-invalid={isInvalid("milestone-choice", !data.wealthMilestoneChoice) || undefined}
                tabIndex={isInvalid("milestone-choice", !data.wealthMilestoneChoice) ? -1 : undefined}
              >
                <button
                  className={data.wealthMilestoneChoice === "yes" ? "selected" : ""}
                  aria-pressed={data.wealthMilestoneChoice === "yes"}
                  onClick={() => {
                    patchData({ wealthMilestoneChoice: "yes" });
                    setError("");
                  }}
                >
                  I have a number in mind
                </button>
                <button
                  className={data.wealthMilestoneChoice === "not-yet" ? "selected" : ""}
                  aria-pressed={data.wealthMilestoneChoice === "not-yet"}
                  onClick={() => {
                    patchData({
                      wealthMilestoneChoice: "not-yet",
                      targetNetworth: "",
                      targetYear: "",
                    });
                    setError("");
                  }}
                >
                  Not yet—my purpose is clear
                </button>
              </div>
              {isInvalid("milestone-choice", !data.wealthMilestoneChoice) && <p className="field-error" role="alert">Choose one option.</p>}
              {data.wealthMilestoneChoice === "yes" && (
                <div className="focus-field milestone-fields">
                  <div className="form-grid">
                    <CurrencyField
                      label="My Wealth Milestone"
                      value={data.targetNetworth}
                      onChange={(targetNetworth) => patchData({ targetNetworth })}
                      invalid={isInvalid("target-networth", !isMoneyValue(data.targetNetworth))}
                      errorMessage="Enter your wealth milestone."
                    />
                    <label className={`field${isInvalid("target-year", numberValue(data.targetYear) <= new Date().getFullYear() || numberValue(data.targetYear) > new Date().getFullYear() + 100) ? " invalid" : ""}`}>
                      <span className="field-heading">
                        <span>By Year</span>
                        <b>Required</b>
                      </span>
                      <input
                        inputMode="numeric"
                        maxLength={4}
                        value={data.targetYear}
                        aria-invalid={isInvalid("target-year", numberValue(data.targetYear) <= new Date().getFullYear() || numberValue(data.targetYear) > new Date().getFullYear() + 100) || undefined}
                        placeholder={String(new Date().getFullYear() + 10)}
                        onChange={(event) =>
                          patchData({
                            targetTiming: "year",
                            targetYear: rawNumber(event.target.value),
                          })
                        }
                      />
                      <input
                        className="amount-slider"
                        type="range"
                        min={new Date().getFullYear() + 1}
                        max={new Date().getFullYear() + 100}
                        step="1"
                        value={
                          numberValue(data.targetYear) ||
                          new Date().getFullYear() + 10
                        }
                        aria-label="Choose target year"
                        onChange={(event) =>
                          patchData({
                            targetTiming: "year",
                            targetYear: event.target.value,
                          })
                        }
                      />
                      {isInvalid("target-year", numberValue(data.targetYear) <= new Date().getFullYear() || numberValue(data.targetYear) > new Date().getFullYear() + 100) && <small className="field-error" role="alert">Enter a future year.</small>}
                    </label>
                  </div>
                </div>
              )}
              <section className="focus-field aspiration-fields">
                <label className="field aspiration-purpose">
                  <span className="field-heading">
                    <span>Describe the life you want to create</span>
                  </span>
                  <textarea
                    maxLength={500}
                    value={data.moneyPurpose}
                    onChange={(event) =>
                      patchData({ moneyPurpose: event.target.value })
                    }
                    placeholder="Picture your work, family, time, home, experiences and contribution. What would an ideal life look and feel like?"
                  />
                </label>
              </section>
              <section className="focus-field aspiration-motivation-card">
                <label className="field aspiration-motivation">
                  <span className="field-heading">
                    <span>Why does this life matter most to you?</span>
                  </span>
                  <textarea
                    maxLength={500}
                    value={data.wealthMotivation}
                    onChange={(event) =>
                      patchData({ wealthMotivation: event.target.value })
                    }
                    placeholder="Think about who this is for, what it would change and why you are committed to making it real."
                  />
                </label>
              </section>
              {data.moneyPurpose.trim() && (
                <blockquote className="aspiration-summary">
                  <div>
                    <span>The life I want</span>
                    <strong>{data.moneyPurpose.trim()}</strong>
                  </div>
                  {data.wealthMilestoneChoice === "yes" &&
                    data.targetNetworth &&
                    data.targetYear && (
                      <small>
                        For me, that means working toward {money.format(numberValue(data.targetNetworth))} by {data.targetYear}.
                      </small>
                    )}
                  {data.wealthMotivation.trim() && (
                    <div className="aspiration-why">
                      <span>Why it matters</span>
                      <p>{data.wealthMotivation.trim()}</p>
                    </div>
                  )}
                </blockquote>
              )}
            </>
          )}

          {step === 10 && (
            <>
              <PageHeading
                number="10"
                eyebrow="From Vision to Action"
                title="What actions are you already considering?"
                copy="Capture every financial action already on your mind. Your MAP will test each one against your numbers, priorities and Vision."
              />
              <div className="choice-instruction action-instruction">
                <span>Choose a category to add an action.</span>
              </div>
              <div className="action-category-tiles" aria-label="Choose an action category">
                {actionCategoryChoices.map((value) => (
                  <button
                    key={value}
                    className={
                      data.proposedActions.some(
                        (action) => action.category === value,
                      )
                        ? "selected"
                        : ""
                    }
                    aria-pressed={data.proposedActions.some(
                      (action) => action.category === value,
                    )}
                    onClick={() => addAction(value)}
                  >
                    + {actionCategoryShortLabels[value]}
                  </button>
                ))}
              </div>
              <div className="action-list">
                {data.proposedActions.map((action, index) => (
                  <article className={invalidFields.some((field) => field.startsWith(`action-${action.id}-`)) ? "has-errors" : ""} key={action.id}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <div className="action-category-label">
                      <span>Category</span>
                      <strong>{action.category ? actionCategoryShortLabels[action.category] : "Action"}</strong>
                    </div>
                    <label className={`field${isInvalid(`action-${action.id}-description`, !action.description.trim()) ? " invalid" : ""}`}>
                      <span className="field-heading">
                        <span>Your Proposed Action</span>
                        <b>Required</b>
                      </span>
                      <textarea
                        value={action.description}
                        aria-invalid={isInvalid(`action-${action.id}-description`, !action.description.trim()) || undefined}
                        onChange={(event) =>
                          updateAction(action.id, {
                            description: event.target.value,
                          })
                        }
                        placeholder="e.g. Review whether to sell one property"
                      />
                      {isInvalid(`action-${action.id}-description`, !action.description.trim()) && <small className="field-error" role="alert">Describe the action you are considering.</small>}
                    </label>
                    <label className="field action-target-date">
                      <span className="field-heading">
                        <span>By When</span>
                      </span>
                      <input
                        type="date"
                        min={localIsoDate()}
                        value={action.targetDate ?? ""}
                        onChange={(event) =>
                          updateAction(action.id, { targetDate: event.target.value })
                        }
                      />
                    </label>
                    <button
                      className="remove"
                      aria-label={`Remove proposed action ${index + 1}`}
                      onClick={() =>
                        patchData({
                          proposedActions: data.proposedActions.filter(
                            (item) => item.id !== action.id,
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {error && error !== PROFILE_REQUIRED_ERROR && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <footer className="wizard-actions">
            <button className="secondary" onClick={() => go(step - 1)}>
              ← Back
            </button>
            <button
              className="primary"
              onClick={
                returnToFinancialPlan && step >= 1 && step <= 5
                  ? returnToPlan
                  : validateAndContinue
              }
            >
              {returnToFinancialPlan && step >= 1 && step <= 5
                ? "Return to Financial Plan"
                : nextStepLabels[step]}{" "}
              <span>→</span>
            </button>
          </footer>
        </section>
      )}

      {step === 11 && (
        <section className="map-page stage-enter">
          <div className="map-inner">
            <header className="print-summary">
              <p>Networth MAP · 90-Day Summary</p>
              <h1>{data.moneyPurpose.trim() || primaryGoalStatement}</h1>
              <div>
                <span>Current Net Worth</span>
                <strong>{money.format(blueprint.networth)}</strong>
              </div>
            </header>
            <p className="eyebrow">Your Networth MAP</p>
            <section className="map-goal" aria-label="Your personal Vision">
              <span>Your Vision</span>
              <blockquote>
                {data.moneyPurpose.trim() || primaryGoalStatement}
              </blockquote>
              {data.wealthMotivation.trim() && (
                <p className="map-goal-why">{data.wealthMotivation.trim()}</p>
              )}
            </section>
            <div className="map-route">
              <div>
                <span><JourneyIcon kind="blueprint" />Your Blueprint</span>
                <small>Financial Status</small>
                <dl>
                  <div className="map-route-featured"><dt>Current Net Worth</dt><dd>{compactMoney(blueprint.networth)}</dd></div>
                  <div><dt>Total Assets</dt><dd>{compactMoney(blueprint.totalAssets)}</dd></div>
                  <div><dt>Total Liabilities</dt><dd>{compactMoney(blueprint.totalLiabilities)}</dd></div>
                </dl>
              </div>
              <i>→</i>
              <div>
                <span><JourneyIcon kind="vision" />Your Vision</span>
                <small>Your North Star</small>
                <dl>
                  <div><dt>Target Net Worth</dt><dd>{numberValue(data.targetNetworth) > 0 ? compactMoney(numberValue(data.targetNetworth)) : "Not set"}</dd></div>
                  <div><dt>Financial Freedom</dt><dd>{compactMoney(blueprint.visionAnnualCost)} / year</dd></div>
                  <div><dt>Increase Amount</dt><dd>{compactMoney(Math.max(0, blueprint.visionAnnualCost - blueprint.currentLifestyle))} / year</dd></div>
                </dl>
              </div>
              <i>→</i>
              <div>
                <span><JourneyIcon kind="map" />MAP</span>
                <small>Top 3 Actions</small>
                <ul>
                  {mapRecommendations.slice(0, 3).map((recommendation) => (
                    <li key={recommendation.id}>{recommendation.title}</li>
                  ))}
                </ul>
              </div>
            </div>
            <header className="map-heading">
              <div>
                <p className="eyebrow">Your Next Moves</p>
                <h1>Start with what matters most.</h1>
              </div>
            </header>
            {mapRecommendations.length ? (
              <section className="additional-actions unified-recommendations">
                <ol>
                  {mapRecommendations.map((recommendation, index) => (
                    <li key={recommendation.id}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <small>{recommendation.category}</small>
                        <h3>{recommendation.title}</h3>
                        <div className="simple-action-sequence">
                          <section>
                            <h4>Our Observations</h4>
                            <p>{recommendation.observation}</p>
                          </section>
                          <section>
                            <h4>What to do</h4>
                            <p>{recommendation.action}</p>
                          </section>
                          <section>
                            <h4>Why it matters</h4>
                            <p>{recommendation.reason}</p>
                          </section>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : (
              <div className="empty-map">
                <h2>No recommendations were generated.</h2>
                <p>Review your financial information and generate the MAP again.</p>
              </div>
            )}
            <section className="adviser-brief">
              <header>
                <span>Prepare for Your Adviser Discussion</span>
                <h2>Take the questions your MAP cannot responsibly answer alone.</h2>
              </header>
              <div>
                <section>
                  <h3>Decisions to Discuss</h3>
                  <ul>
                    {blueprint.actionAssessments.map((assessment) => (
                      <li key={assessment.id}>{assessment.action}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>Information to Verify</h3>
                  <p>Risk capacity, dependants, insurance, taxes, legal ownership, product costs and the liquidity required before each decision.</p>
                </section>
                <section>
                  <h3>Questions to Carry Forward</h3>
                  <ul>
                    {blueprint.actionAssessments.map((assessment) => (
                      <li key={assessment.id}>{assessment.discussionQuestion}</li>
                    ))}
                  </ul>
                </section>
              </div>
              <p>This educational MAP does not determine suitability. If you seek personalised investment advice, use a qualified adviser who can complete the required fact-finding, risk profiling and suitability assessment.</p>
            </section>
            <section className="print-full-details" aria-label="Complete assessment details">
              <h2>Complete Financial Details</h2>
              <div className="print-detail-grid">
                <div><span>Current Net Worth</span><strong>{money.format(blueprint.networth)}</strong></div>
                <div><span>Total Assets</span><strong>{money.format(blueprint.totalAssets)}</strong></div>
                <div><span>Total Liabilities</span><strong>{money.format(blueprint.totalLiabilities)}</strong></div>
                <div><span>Income Before Tax</span><strong>{money.format(numberValue(data.grossPersonalIncome))}</strong></div>
                <div><span>Estimated Take-home</span><strong>{money.format(blueprint.takeHomeIncome)}</strong></div>
                <div><span>Annual Lifestyle</span><strong>{money.format(blueprint.currentLifestyle)}</strong></div>
                <div><span>Annual Debt Repayment</span><strong>{money.format(blueprint.totalAnnualDebtRepayment)}</strong></div>
                <div><span>Annual Investing</span><strong>{money.format(blueprint.annualInvesting)}</strong></div>
                <div><span>Available Cash</span><strong>{money.format(blueprint.availableSurplus)}</strong></div>
                <div><span>Liquidity After Investing</span><strong>{money.format(blueprint.cashAfterInvesting)}</strong></div>
              </div>
              <h3>Assets</h3>
              <table>
                <thead><tr><th>Asset</th><th>Category</th><th>Primary Use</th><th>Value</th><th>Annual Income</th></tr></thead>
                <tbody>
                  {data.assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>{asset.description || "—"}</td>
                      <td>{assetCategoryLabels[asset.category]}</td>
                      <td>{asset.purpose === "investment" ? "Investments" : asset.purpose === "personal" ? "Personal / Lifestyle" : "—"}</td>
                      <td>{money.format(numberValue(asset.value))}</td>
                      <td>{money.format(numberValue(asset.annualNetIncome ?? ""))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3>Liabilities</h3>
              <table>
                <thead><tr><th>Liability</th><th>Category</th><th>Outstanding</th><th>Interest</th><th>Annual Repayment</th></tr></thead>
                <tbody>
                  {data.liabilities.map((liability) => (
                    <tr key={liability.id}>
                      <td>{liability.description || "—"}</td>
                      <td>{liabilityTypeLabels[liability.type]}</td>
                      <td>{money.format(numberValue(liability.value))}</td>
                      <td>{numberValue(liability.interestRate ?? "").toFixed(1)}%</td>
                      <td>{money.format(numberValue(liability.annualRepayment ?? ""))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3>Vision and Goals</h3>
              <div className="print-detail-copy">
                <p><strong>Vision:</strong> {visionLabel} · {money.format(blueprint.visionAnnualCost)} per year</p>
                {data.moneyPurpose.trim() && <p><strong>Life envisioned:</strong> {data.moneyPurpose.trim()}</p>}
                {data.wealthMotivation.trim() && <p><strong>Why it matters:</strong> {data.wealthMotivation.trim()}</p>}
                {data.wealthGoals.map((goal) => {
                  const detail = data.wealthGoalDetails[goal];
                  return <p key={goal}><strong>{wealthGoalLabels[goal]}:</strong> {detail?.description || "—"} · {money.format(numberValue(detail?.amount ?? ""))}{detail?.targetYear ? ` · ${detail.targetYear}` : ""}</p>;
                })}
              </div>
              {!!data.proposedActions.length && (
                <>
                  <h3>Actions Entered</h3>
                  <ul className="print-entered-actions">
                    {data.proposedActions.map((action) => (
                      <li key={action.id}><strong>{action.category ? actionCategoryShortLabels[action.category] : "Action"}:</strong> {action.description}{action.targetDate ? ` · By ${action.targetDate}` : ""}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            {!emailCaptureDismissed && (
              <section className="email-capture" aria-labelledby="email-capture-title">
                <button
                  type="button"
                  className="email-capture-close"
                  aria-label="Close consultation options"
                  onClick={() => setEmailCaptureDismissed(true)}
                >
                  ×
                </button>
                <div>
                  <span>Need More Clarity?</span>
                  <h2 id="email-capture-title">Complimentary 30-minute Networth Consultation</h2>
                  <p>Discuss your MAP priorities, one decision you face now, and your next 90-day steps.</p>
                  <p>Complete your Networth MAP first. First 25 consultations only.</p>
                </div>
                <div className="email-contact-options">
                  <form
                    className="email-capture-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitEmail();
                    }}
                  >
                    <label className="field">
                      <span>Email address</span>
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={emailAddress}
                        onChange={(event) => setEmailAddress(event.target.value)}
                      />
                    </label>
                    <label className="email-consent">
                      <input
                        type="checkbox"
                        required
                        checked={emailConsent}
                        onChange={(event) => setEmailConsent(event.target.checked)}
                      />
                      <span>I consent to being contacted by email about my Networth MAP.</span>
                    </label>
                    <button className="primary" type="submit" disabled={emailSubmitting}>
                      {emailSubmitting ? "Saving…" : "Submit Email"}
                    </button>
                    {emailStatus && <p className="email-status" role="status">{emailStatus}</p>}
                  </form>
                  <div className="email-submit-divider" aria-hidden="true" />
                  <a
                    className="primary email-booking-link"
                    href={CALENDLY_CONTACT_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <rect x="3" y="6" width="12" height="12" rx="2" />
                      <path d="m15 10 5-3v10l-5-3z" />
                    </svg>
                    Book Your Consultation
                  </a>
                  <div className="email-contact-alternative">
                    <a
                      className="secondary email-whatsapp"
                      href={WHATSAPP_CONTACT_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.4-4.1A8 8 0 1 1 20 11.6Z" />
                        <path d="M9 8.5c.5 2.7 2 4.2 4.7 4.9l1.2-1.1 1.8.9c.2.1.3.4.2.7-.4 1.1-1.4 1.8-2.6 1.7-4.1-.4-7.2-3.5-7.6-7.6-.1-1.2.6-2.2 1.7-2.6.3-.1.6 0 .7.2l.9 1.8Z" />
                      </svg>
                      WhatsApp Your Questions
                    </a>
                  </div>
                  <p>30 minutes. One conversation. Greater financial clarity.</p>
                </div>
              </section>
            )}
            <div className="map-actions">
              <div>
                <button className="secondary dark" onClick={() => go(6)}>
                  Your Wealth
                </button>
                <button className="secondary dark" onClick={() => go(7)}>
                  Your Vision
                </button>
                <button
                  className="secondary dark"
                  onClick={() => {
                    track("map_printed", { step: 11 });
                    window.print();
                  }}
                >
                  Print or Save MAP
                </button>
                <button
                  className="primary"
                  onClick={copyActions}
                  disabled={!blueprint.actionAssessments.length && !blueprint.unaddressedFindings.length}
                >
                  Copy Your Next Moves
                </button>
                <button className="delete" onClick={reset}>
                  Delete This Assessment
                </button>
              </div>
            </div>
            {copyStatus && (
              <p className="copy-status" role="status">
                {copyStatus}
              </p>
            )}
            <section className="clarity-check" aria-labelledby="clarity-question">
              <div>
                <span>Your feedback</span>
                <h2 id="clarity-question">
                  Did this assessment give you greater financial clarity?
                </h2>
              </div>
              <div className="choice-row" role="group" aria-labelledby="clarity-question">
                {(["yes", "partly", "no"] as ClarityRating[]).map((rating) => (
                  <button
                    key={rating}
                    className={clarityRating === rating ? "selected" : ""}
                    aria-pressed={clarityRating === rating}
                    disabled={Boolean(clarityRating)}
                    onClick={() => void sendClarityRating(rating)}
                  >
                    {rating === "yes"
                      ? "Yes"
                      : rating === "partly"
                        ? "Partly"
                        : "No"}
                  </button>
                ))}
              </div>
              {clarityRating && (
                <p role="status">Thank you. This helps improve the assessment.</p>
              )}
            </section>
            <p className="map-disclaimer">
              <span>
                Educational financial assessment only. This MAP is based on the information you provided.
              </span>
              <span>
                It does not constitute investment, tax, legal or product advice, recommend buying or selling any specific asset, or guarantee any outcome or return.
              </span>
            </p>
          </div>
        </section>
      )}

      {showQuickStart && (
        <div
          className="quick-start-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-start-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowQuickStart(false);
          }}
        >
          <div className="quick-start-card">
            <button
              className="quick-start-close"
              type="button"
              aria-label="Close quick start"
              onClick={() => setShowQuickStart(false)}
            >
              ×
            </button>
            <p className="eyebrow">Before you begin</p>
            <h2 id="quick-start-title">Your best estimates are enough.</h2>
            <p className="quick-start-intro">
              Keep these three numbers roughly ready. You can refine them as
              you go.
            </p>
            <ol className="quick-start-list">
              <li>
                <b>01</b>
                <span>Annual income and estimated tax rate</span>
              </li>
              <li>
                <b>02</b>
                <span>Current asset and loan balances</span>
              </li>
              <li>
                <b>03</b>
                <span>Average monthly household and lifestyle costs</span>
              </li>
            </ol>
            <p className="quick-start-reassurance">
              About 20 minutes · Remembered privately in your account
            </p>
            <button
              autoFocus
              className="primary"
              onClick={() => {
                setShowQuickStart(false);
                track("assessment_started", { step: 0 });
                go(1);
              }}
            >
              Start My Blueprint <span>→</span>
            </button>
          </div>
        </div>
      )}

      <dialog
        className="feedback-dialog"
        ref={feedbackDialogRef}
        aria-labelledby="feedback-title"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendFeedback();
          }}
        >
          <div className="feedback-dialog-heading">
            <div>
              <p className="eyebrow">Help improve Networth MAP</p>
              <h2 id="feedback-title">Report an issue</h2>
            </div>
            <button
              type="button"
              className="feedback-close"
              aria-label="Close issue report"
              onClick={() => feedbackDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <label className="field">
            <span>What happened?</span>
            <select
              value={feedbackCategory}
              onChange={(event) =>
                setFeedbackCategory(event.target.value as FeedbackCategory)
              }
            >
              {Object.entries(feedbackCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Tell us briefly what went wrong (if needed)</span>
            <textarea
              value={feedbackMessage}
              maxLength={400}
              onChange={(event) => {
                setFeedbackMessage(event.target.value);
                setFeedbackStatus("");
              }}
              placeholder="Describe the issue without including any financial figures or personal information."
            />
            <small>{feedbackMessage.length}/400 characters</small>
          </label>
          <p className="feedback-privacy-note">
            Do not include financial figures, names, email addresses, phone
            numbers or other personal information. Your assessment answers are
            never attached to this report.
          </p>
          {feedbackStatus && (
            <p className="feedback-status" role="status">
              {feedbackStatus}
            </p>
          )}
          <div className="feedback-dialog-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => feedbackDialogRef.current?.close()}
            >
              Cancel
            </button>
            <button className="primary" type="submit">
              Send Feedback
            </button>
          </div>
        </form>
      </dialog>

      {recovery && (
        <div className="recovery-overlay">
          <div
            className="recovery-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-title"
          >
            <p className="eyebrow">Assessment found</p>
            <h2 id="recovery-title">Continue your saved assessment?</h2>
            <p>
              Your previous answers are remembered privately in your account.
              days.
            </p>
            <div>
              <button className="secondary" onClick={reset}>
                Start a New Assessment
              </button>
              <button
                ref={recoveryContinueRef}
                className="primary"
                onClick={() => {
                  setData(recovery.data);
                  setStep(recovery.step);
                  setRecovery(null);
                  track("assessment_resumed", { step: recovery.step });
                }}
              >
                Continue Assessment <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


// Share the original welcome screen with the app entry point.
export function NetworthWelcome({onBuild, buttonLabel = "Build My Networth Map", disabled = false}: {onBuild: () => void; buttonLabel?: string; disabled?: boolean}) {
  return (
        <section className="welcome">
          <div className="hero-copy">
            <p className="eyebrow">A guided 20-minute financial clarity assessment</p>
            <h1 className="direction-headline">
              <span>Your wealth.</span>
              <span>Your vision.</span>
              <em>Your next move.</em>
            </h1>
            <p>
              Know your wealth. Define your vision. Make your next move with
              clarity.
            </p>
            <button
              className="primary"
              onClick={onBuild}
              disabled={disabled}
            >
              {buttonLabel} <span aria-hidden="true">→</span>
            </button>
            <small>
              Remembered privately in your account;
              an optional email is requested only after your result.
            </small>
            <small className="anonymous-insight-note">
              Usage and feedback help improve the app. Your financial
              answers stay private in your account.
            </small>
          </div>
          <div className="journey-tiles">
            <article>
              <b>01</b>
              <span><JourneyIcon kind="blueprint" />BLUEPRINT</span>
              <h2>See where you are today</h2>
              <p>Earn · Own · Owe · Spend · Invest</p>
            </article>
            <article>
              <b>02</b>
              <span><JourneyIcon kind="vision" />VISION</span>
              <h2>Define where you want to go</h2>
              <p>Security · Independence · Freedom</p>
            </article>
            <article>
              <b>03</b>
              <span><JourneyIcon kind="map" />MAP</span>
              <h2>Choose what to focus on next</h2>
              <p>Your actions assessed against your numbers</p>
            </article>
          </div>
        </section>
  );
}
