// Reused unchanged from /Users/admin/buildweek/src/app/networth-v2.ts.
export type UserType =
  | ""
  | "founder"
  | "business-owner"
  | "professional"
  | "salaried";
export type AssetCategory =
  | "cash"
  | "financial"
  | "property"
  | "business"
  | "retirement"
  | "gold"
  | "other";
export type AssetPurpose = "investment" | "personal" | "";

export const normalizeAssetPurpose = (value: unknown): AssetPurpose =>
  value === "investment" ||
  value === "wealth" ||
  value === "growth" ||
  value === "income"
    ? "investment"
    : value === "personal"
      ? "personal"
      : "";
export type LiabilityType =
  | "property"
  | "business"
  | "personal"
  | "vehicle"
  | "credit"
  | "other";
export type LiabilityClass = "personal" | "business";
export type VisionLevel = "" | "security" | "independence" | "freedom";
export type WealthMilestoneChoice = "" | "yes" | "not-yet";
export type WealthGoal =
  | "needs"
  | "commitments"
  | "responsibilities"
  | "progress"
  | "desires"
  | "dreams"
  | "legacy"
  | "other";
export type WealthGoalDetail = {
  description: string;
  amount: string;
  targetYear: string;
  priority: "" | "must" | "important" | "aspirational";
  flexibility: "" | "date" | "amount" | "both" | "neither";
};
export type LifestyleCategory =
  | "lifestyle"
  | "wealth"
  | "home"
  | "mobility"
  | "travel"
  | "health"
  | "family"
  | "convenience"
  | "learning"
  | "giving"
  | "other";
export type LifestyleChange = {
  id: string;
  category: LifestyleCategory;
  description: string;
  direction: "increase" | "decrease";
  monthlyAmount: string;
  startDate: string;
};
export type TargetTiming = "age" | "year";
export type ActionCategory =
  | "review-asset"
  | "increase-liquidity"
  | "increase-investing"
  | "reallocate-investments"
  | "reduce-spending"
  | "repay-debt"
  | "change-income"
  | "protect-risk"
  | "fund-goal"
  | "tax-planning"
  | "estate-planning"
  | "separate-finances"
  | "other";

export type Asset = {
  id: string;
  description: string;
  category: AssetCategory;
  value: string;
  purpose: AssetPurpose;
  annualNetIncome?: string;
};
export type Liability = {
  id: string;
  description: string;
  type: LiabilityType;
  value: string;
  interestRate?: string;
  annualRepayment?: string;
  repaymentIncludedInNeeds?: boolean;
  classification: LiabilityClass;
};
export type ProposedAction = {
  id: string;
  category: ActionCategory | "";
  description: string;
  targetDate?: string;
};

export type AssessmentData = {
  userType: UserType;
  grossPersonalIncome: string;
  effectiveTaxRate: string;
  assets: Asset[];
  liabilities: Liability[];
  hasNoLiabilitiesConfirmed: boolean;
  loanRepaymentIncludedInNeeds: boolean;
  monthlyNeeds: string;
  monthlyWants: string;
  annualInvesting: string;
  visionLevel: VisionLevel;
  visionChoiceConfirmed: boolean;
  wealthGoals: WealthGoal[];
  wealthGoalDetails: Partial<Record<WealthGoal, WealthGoalDetail>>;
  lifestyleChanges: LifestyleChange[];
  desiredLifestyleMonthly: string;
  currentAge: string;
  targetTiming: TargetTiming;
  targetAge: string;
  targetYear: string;
  targetNetworth: string;
  wealthMilestoneChoice: WealthMilestoneChoice;
  moneyPurpose: string;
  wealthMotivation: string;
  proposedActions: ProposedAction[];
};

export type Finding = {
  id: string;
  category: string;
  title: string;
  observation: string;
  evidence: string;
  reason: string;
  userAction: string;
  mapPerspective: string;
  action: string;
  urgency: number;
  impact: number;
  confidence: number;
  actionability: number;
  overlapGroup: string;
};

export type ActionAssessmentStatus =
  | "supported"
  | "not-supported"
  | "refine"
  | "reconsider"
  | "more-information";
export type ActionHorizon =
  | "act-now"
  | "resolve-gap-first"
  | "plan-next"
  | "monitor"
  | "discuss";
export type ActionAssessment = {
  id: string;
  category: ActionCategory;
  action: string;
  status: ActionAssessmentStatus;
  horizon: ActionHorizon;
  evidence: string;
  perspective: string;
  tradeoff: string;
  nextStep: string;
  discussionQuestion: string;
};

export type Blueprint = {
  estimatedTax: number;
  takeHomeIncome: number;
  totalAssets: number;
  wealthAssets: number;
  personalAssets: number;
  totalLiabilities: number;
  totalAnnualInterest: number;
  totalAnnualDebtRepayment: number;
  annualDebtRepaymentDeducted: number;
  assetIncomeInterestCoverage: number | null;
  networth: number;
  annualNeeds: number;
  annualWants: number;
  currentLifestyle: number;
  lifestyleCostShareOfTakeHome: number | null;
  availableSurplus: number;
  cashAfterInvesting: number;
  annualInvesting: number;
  investingRate: number;
  wealthAssetPercent: number;
  personalAssetPercent: number;
  debtPercent: number;
  propertyPercent: number;
  accessibleAssets: number;
  accessibleMonths: number | null;
  largestAsset: Asset | null;
  largestAssetPercent: number;
  visionAnnualCost: number;
  yearsToVision: number;
  visionFundingGap: number;
  requiredMonthlyInvestment: number;
  totalAssetIncome: number;
  incomeGeneratingAssets: number;
  assetIncomeYield: number | null;
  networthIncomeYield: number | null;
  lifestyleFundedByAssetIncome: number;
  actionAssessments: ActionAssessment[];
  unaddressedFindings: Finding[];
  findings: Finding[];
  nextFindings: Finding[];
};

export const emptyAssessment: AssessmentData = {
  userType: "",
  grossPersonalIncome: "",
  effectiveTaxRate: "20",
  assets: [],
  liabilities: [],
  hasNoLiabilitiesConfirmed: false,
  loanRepaymentIncludedInNeeds: false,
  monthlyNeeds: "",
  monthlyWants: "",
  annualInvesting: "",
  visionLevel: "",
  visionChoiceConfirmed: false,
  wealthGoals: [],
  wealthGoalDetails: {},
  lifestyleChanges: [],
  desiredLifestyleMonthly: "",
  currentAge: "",
  targetTiming: "age",
  targetAge: "",
  targetYear: "",
  targetNetworth: "",
  wealthMilestoneChoice: "",
  moneyPurpose: "",
  wealthMotivation: "",
  proposedActions: [],
};

export const assetCategoryLabels: Record<AssetCategory, string> = {
  cash: "Cash & Deposits",
  financial: "Financial Investments",
  property: "Property & Real Estate",
  business: "Business Ownership",
  retirement: "Retirement Assets",
  gold: "Gold & Jewellery",
  other: "Other Asset",
};

export const liabilityTypeLabels: Record<LiabilityType, string> = {
  property: "Home / Property Loan",
  business: "Personally Borne Business Liability",
  personal: "Personal Loan",
  vehicle: "Vehicle Loan",
  credit: "Credit Card / Short-Term Debt",
  other: "Other Liability",
};

export const actionCategoryLabels: Record<ActionCategory, string> = {
  "review-asset": "Buy, Sell or Review an Asset",
  "increase-liquidity": "Build Cash or Emergency Reserves",
  "increase-investing": "Increase Regular Investing",
  "reallocate-investments": "Reallocate Investments",
  "reduce-spending": "Reduce Spending",
  "repay-debt": "Repay, Refinance or Restructure Debt",
  "change-income": "Increase or Change Income",
  "protect-risk": "Add or Review Protection",
  "fund-goal": "Fund a Life Goal",
  "tax-planning": "Review Tax Planning",
  "estate-planning": "Review Estate, Will or Nominations",
  "separate-finances": "Separate Personal and Business Finances",
  other: "Other Action",
};

const numberValue = (value: string) => Number(value) || 0;
const ratio = (part: number, whole: number) =>
  whole > 0 ? (part / whole) * 100 : 0;
const nullableRatio = (part: number, whole: number) =>
  whole > 0 ? (part / whole) * 100 : null;
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const percent = (value: number) => `${value.toFixed(1)}%`;

type Candidate = Omit<Finding, "userAction" | "mapPerspective"> & {
  actionCategories: ActionCategory[];
};

export const formatActionsForClipboard = (
  findings: Finding[],
  assessments: ActionAssessment[] = [],
) => {
  if (!assessments.length)
    return findings
      .map((finding, index) => `${index + 1}. ${finding.title}\n${finding.action}`)
      .join("\n\n");
  const assessed = assessments
    .map(
      (item, index) =>
        `${index + 1}. ${item.action}\n${item.nextStep}\nDiscuss: ${item.discussionQuestion}`,
    )
    .join("\n\n");
  const blindSpots = findings.length
    ? `\n\nIMPORTANT AREAS YOU MAY HAVE MISSED\n\n${findings
        .map(
          (finding, index) =>
            `${index + 1}. ${finding.title}\n${finding.action}`,
        )
        .join("\n\n")}`
    : "";
  return `YOUR ACTIONS, ASSESSED\n\n${assessed}${blindSpots}`;
};

export const calculateAnnualInterest = (liability: Liability) =>
  (numberValue(liability.value) * numberValue(liability.interestRate ?? "")) /
  100;

export function calculateMap(data: AssessmentData): Blueprint {
  const grossIncome = numberValue(data.grossPersonalIncome);
  const estimatedTax =
    (grossIncome *
      Math.min(100, Math.max(0, numberValue(data.effectiveTaxRate)))) /
    100;
  const takeHomeIncome = grossIncome - estimatedTax;
  const totalAssets = data.assets.reduce(
    (sum, asset) => sum + numberValue(asset.value),
    0,
  );
  const wealthAssets = data.assets
    .filter((asset) => asset.purpose === "investment")
    .reduce((sum, asset) => sum + numberValue(asset.value), 0);
  const personalAssets = data.assets
    .filter((asset) => asset.purpose === "personal")
    .reduce((sum, asset) => sum + numberValue(asset.value), 0);
  const totalAssetIncome = data.assets.reduce(
    (sum, asset) => sum + numberValue(asset.annualNetIncome ?? ""),
    0,
  );
  const incomeGeneratingAssets = data.assets
    .filter((asset) => numberValue(asset.annualNetIncome ?? "") > 0)
    .reduce((sum, asset) => sum + numberValue(asset.value), 0);
  const totalLiabilities = data.liabilities.reduce(
    (sum, liability) => sum + numberValue(liability.value),
    0,
  );
  const totalAnnualInterest = data.liabilities.reduce(
    (sum, liability) => sum + calculateAnnualInterest(liability),
    0,
  );
  const totalAnnualDebtRepayment = data.liabilities.reduce(
    (sum, liability) => sum + numberValue(liability.annualRepayment ?? ""),
    0,
  );
  const annualDebtRepaymentDeducted = data.liabilities.reduce(
    (sum, liability) =>
      sum +
      (liability.repaymentIncludedInNeeds === true
        ? 0
        : numberValue(liability.annualRepayment ?? "")),
    0,
  );
  const assetIncomeInterestCoverage = nullableRatio(
    totalAssetIncome,
    totalAnnualInterest,
  );
  const networth = totalAssets - totalLiabilities;
  const annualNeeds = numberValue(data.monthlyNeeds) * 12;
  const annualWants = numberValue(data.monthlyWants) * 12;
  const currentLifestyle = annualNeeds + annualWants;
  const lifestyleCostShareOfTakeHome = nullableRatio(
    currentLifestyle,
    takeHomeIncome,
  );
  const assetIncomeYield = nullableRatio(
    totalAssetIncome,
    incomeGeneratingAssets,
  );
  const networthIncomeYield = nullableRatio(totalAssetIncome, networth);
  const lifestyleFundedByAssetIncome = ratio(
    totalAssetIncome,
    currentLifestyle,
  );
  const annualInvesting = numberValue(data.annualInvesting);
  const availableSurplus =
    takeHomeIncome - currentLifestyle - annualDebtRepaymentDeducted;
  const cashAfterInvesting = availableSurplus - annualInvesting;
  const investingRate = ratio(annualInvesting, takeHomeIncome);
  const wealthAssetPercent = ratio(wealthAssets, totalAssets);
  const personalAssetPercent = ratio(personalAssets, totalAssets);
  const debtPercent = ratio(totalLiabilities, totalAssets);
  const propertyValue = data.assets
    .filter((asset) => asset.category === "property")
    .reduce((sum, asset) => sum + numberValue(asset.value), 0);
  const propertyPercent = ratio(propertyValue, totalAssets);
  const accessibleAssets = data.assets
    .filter(
      (asset) => asset.category === "cash" || asset.category === "financial",
    )
    .reduce((sum, asset) => sum + numberValue(asset.value), 0);
  const monthlyLifestyle = numberValue(data.monthlyNeeds) + numberValue(data.monthlyWants);
  const accessibleMonths =
    monthlyLifestyle > 0
      ? accessibleAssets / monthlyLifestyle
      : null;
  const largestAsset =
    [...data.assets].sort(
      (a, b) => numberValue(b.value) - numberValue(a.value),
    )[0] || null;
  const largestAssetPercent = ratio(
    largestAsset ? numberValue(largestAsset.value) : 0,
    totalAssets,
  );
  const largestAssetRole =
    largestAsset?.purpose === "investment"
      ? "Investments"
      : largestAsset?.purpose === "personal"
        ? "Personal / Lifestyle"
        : "";
  const lifestyleChangeMonthly = data.lifestyleChanges.reduce(
    (sum, change) =>
      sum +
      (change.direction === "decrease" ? -1 : 1) *
        numberValue(change.monthlyAmount),
    0,
  );
  const lifestyleBaselineMonthly =
    data.visionLevel === "security" ? annualNeeds / 12 : currentLifestyle / 12;
  const desiredLifestyleMonthly = data.lifestyleChanges.length
    ? Math.max(0, lifestyleBaselineMonthly + lifestyleChangeMonthly)
    : data.visionLevel === "freedom" &&
        numberValue(data.desiredLifestyleMonthly) > 0
      ? numberValue(data.desiredLifestyleMonthly)
      : lifestyleBaselineMonthly;
  const visionAnnualCost = desiredLifestyleMonthly * 12;
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const lifestyleTargetDate = data.lifestyleChanges.reduce((latest, change) => {
    const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(change.startDate)
      ? new Date(`${change.startDate}T00:00:00`).getTime()
      : 0;
    return Math.max(latest, timestamp);
  }, 0);
  const hasTargetNetworth = numberValue(data.targetNetworth) > 0;
  const contextualYears = hasTargetNetworth
    ? Math.max(0, numberValue(data.targetYear) - currentYear)
    : lifestyleTargetDate > currentDate.getTime()
      ? (lifestyleTargetDate - currentDate.getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
      : 0;
  const legacyAgeYears = Math.max(
    0,
    numberValue(data.targetAge) - numberValue(data.currentAge),
  );
  const yearsToVision = contextualYears || legacyAgeYears;
  const statedNetworthGap = Math.max(
    0,
    numberValue(data.targetNetworth) - networth,
  );
  const visionFundingGap = hasTargetNetworth
    ? statedNetworthGap
    : visionAnnualCost;
  const requiredMonthlyInvestment =
    yearsToVision > 0 ? visionFundingGap / (yearsToVision * 12) : 0;
  const visionName =
    data.visionLevel === "security"
      ? "Financial Security"
      : data.visionLevel === "freedom"
        ? "Financial Freedom"
        : "Financial Independence";
  const candidates: Candidate[] = [];
  const add = (candidate: Candidate) => candidates.push(candidate);

  const surplusRate = ratio(availableSurplus, takeHomeIncome);
  if (availableSurplus < 0 || (takeHomeIncome > 0 && surplusRate <= 10))
    add({
      id: "cash-capacity",
      category: "Cash Flow",
      title:
        availableSurplus < 0
          ? "Restore Annual Cash Capacity"
          : "Strengthen Annual Surplus",
      observation:
        availableSurplus < 0
          ? `Your current lifestyle${annualDebtRepaymentDeducted > 0 ? " and debt repayment" : ""} exceed estimated take-home income by ${money.format(Math.abs(availableSurplus))} a year.`
          : `Only ${percent(surplusRate)} of estimated take-home income remains before investing.`,
      evidence: `${money.format(takeHomeIncome)} take-home − ${money.format(currentLifestyle)} lifestyle${annualDebtRepaymentDeducted > 0 ? ` − ${money.format(annualDebtRepaymentDeducted)} debt repayment` : ""} = ${money.format(availableSurplus)} available surplus`,
      reason:
        "An annual cash shortfall makes it harder to invest consistently or absorb unexpected costs without using debt or selling assets.",
      action:
        `${money.format(Math.abs(availableSurplus))} per year: decide this week which household cost to reduce or income source to increase to close the annual cash shortfall.`,
      urgency: availableSurplus < 0 ? 5 : 3,
      impact: 5,
      confidence: 5,
      actionability: 5,
      overlapGroup: "cash-capacity",
      actionCategories: ["reduce-spending", "change-income"],
    });

  if (annualInvesting > Math.max(0, availableSurplus))
    add({
      id: "investing-source",
      category: "Investing",
      title: "Clarify How Investing Is Being Funded",
      observation: `Annual investing is ${money.format(annualInvesting)}, while calculated available surplus is ${money.format(availableSurplus)}.`,
      evidence: `${money.format(annualInvesting - availableSurplus)} difference between investing and current-year surplus`,
      reason:
        "The difference may come from past savings, irregular income, borrowing or asset sales. Understanding the source prevents an unsustainable pattern from being mistaken for recurring capacity.",
      action:
        `${money.format(Math.max(0, annualInvesting - availableSurplus))} per year: decide this week whether this investing difference is funded by recurring income, past savings, borrowing or asset sales.`,
      urgency: 4,
      impact: 4,
      confidence: 5,
      actionability: 5,
      overlapGroup: "investing",
      actionCategories: [
        "increase-investing",
        "change-income",
        "reduce-spending",
      ],
    });
  else if (takeHomeIncome > 0 && investingRate < 20)
    add({
      id: "investing-rate",
      category: "Investing",
      title: "Improve Income-to-Investment Conversion",
      observation: `${percent(investingRate)} of estimated take-home income is currently invested each year.`,
      evidence: `${money.format(annualInvesting)} invested from ${money.format(takeHomeIncome)} estimated take-home income`,
      reason:
        investingRate < 10
          ? "A low conversion rate may slow the growth of wealth-building assets."
          : "The investing rate deserves review after essential reserves and lifestyle costs are protected.",
      action:
        `${money.format(Math.max(0, cashAfterInvesting))} per year (${money.format(Math.max(0, cashAfterInvesting) / 12)} per month): decide this week whether it goes to liquidity, debt reduction, investing or a planned purchase.`,
      urgency: investingRate < 10 ? 4 : 2,
      impact: 4,
      confidence: 5,
      actionability: 5,
      overlapGroup: "investing",
      actionCategories: ["increase-investing", "reduce-spending"],
    });

  if (largestAsset && largestAssetPercent >= 50)
    add({
      id: "asset-concentration",
      category: "Asset Structure",
      title: `Review Concentration in ${largestAsset.description}`,
      observation: `One asset represents ${percent(largestAssetPercent)} of everything you own.`,
      evidence: `${money.format(numberValue(largestAsset.value))} in ${largestAsset.description} from ${money.format(totalAssets)} total assets`,
      reason:
        "A single large holding can dominate liquidity, income potential and the consequences of one financial decision.",
      action:
        `${money.format(numberValue(largestAsset.value))} — ${percent(largestAssetPercent)} concentration in ${largestAsset.description}${largestAssetRole ? `, marked “${largestAssetRole}”` : ""}: decide this week whether that concentration fits your goal and the liquidity you need in the next 12 months.`,
      urgency: largestAssetPercent >= 70 ? 4 : 3,
      impact: 5,
      confidence: 5,
      actionability: 4,
      overlapGroup: "asset-structure",
      actionCategories: ["review-asset", "increase-liquidity"],
    });
  else if (personalAssetPercent >= 50)
    add({
      id: "lifestyle-assets",
      category: "Asset Structure",
      title: "Review the Role of Personal-Use Assets",
      observation: `${percent(personalAssetPercent)} of total assets are classified as personal-use or lifestyle assets.`,
      evidence: `${money.format(personalAssets)} personal-use assets from ${money.format(totalAssets)} total assets`,
      reason:
        "Personal-use assets can be valuable and intentional, but they may not directly build financial flexibility or fund future lifestyle costs.",
      action:
        `${money.format(personalAssets)} in personal-use assets: decide this week whether any one holding needs a formal purpose and capital limit before more money is added.`,
      urgency: personalAssetPercent >= 70 ? 4 : 2,
      impact: 4,
      confidence: 5,
      actionability: 4,
      overlapGroup: "asset-structure",
      actionCategories: ["review-asset", "increase-investing"],
    });

  if (accessibleMonths !== null && accessibleMonths < 12)
    add({
      id: "accessible-assets",
      category: "Liquidity",
      title: "Strengthen Accessible Financial Resources",
      observation: `Cash and financial investments equal approximately ${accessibleMonths.toFixed(1)} months of current lifestyle costs.`,
      evidence: `${money.format(accessibleAssets)} accessible assets ÷ ${money.format(monthlyLifestyle)} monthly lifestyle cost`,
      reason:
        "A high headline net worth can still leave limited flexibility when most assets are difficult to access quickly.",
      action:
        `${money.format(accessibleAssets)} is currently accessible: decide this week how many months of current lifestyle costs you will hold without relying on a rushed asset sale.`,
      urgency: accessibleMonths < 6 ? 4 : 2,
      impact: 5,
      confidence: 4,
      actionability: 4,
      overlapGroup: "liquidity",
      actionCategories: ["increase-liquidity", "review-asset"],
    });

  if (debtPercent >= 20)
    add({
      id: "debt-structure",
      category: "Liabilities",
      title: "Review the Liability Structure",
      observation: `Liabilities equal ${percent(debtPercent)} of total assets.`,
      evidence: `${money.format(totalLiabilities)} liabilities against ${money.format(totalAssets)} assets`,
      reason:
        debtPercent >= 40
          ? "A high liability burden can restrict future cash-flow flexibility and increase the cost of financial mistakes."
          : "Debt should be reviewed alongside available surplus and the purpose of the assets it supports.",
      action:
        `${money.format(totalLiabilities)} is outstanding: decide this week which single liability should be repaid faster, restructured or intentionally left unchanged.`,
      urgency: debtPercent >= 40 ? 5 : 3,
      impact: 4,
      confidence: 5,
      actionability: 4,
      overlapGroup: "debt",
      actionCategories: ["repay-debt"],
    });

  if (
    data.visionLevel === "freedom" &&
    visionAnnualCost > currentLifestyle * 1.25 &&
    currentLifestyle > 0
  )
    add({
      id: "freedom-step-up",
      category: "Vision",
      title: "Structure the Step-Up to Your Freedom Lifestyle",
      observation: `Your desired lifestyle costs ${money.format(visionAnnualCost)} a year, compared with ${money.format(currentLifestyle)} today.`,
      evidence: `${money.format(visionAnnualCost - currentLifestyle)} annual increase between current and desired lifestyle`,
      reason:
        "The difference is not a forecast or funding gap, but it is a meaningful design requirement for future income, investing and asset decisions.",
      action:
        `${money.format(visionAnnualCost - currentLifestyle)} per year separates today’s lifestyle from Freedom: decide this week which one desired-life component is essential enough to fund first.`,
      urgency: 2,
      impact: 4,
      confidence: 4,
      actionability: 4,
      overlapGroup: "vision",
      actionCategories: [
        "change-income",
        "increase-investing",
        "reduce-spending",
      ],
    });

  if (hasTargetNetworth && yearsToVision > 0 && statedNetworthGap > 0)
    add({
      id: "vision-pace",
      category: "Vision",
      title:
        yearsToVision <= 5
          ? `Accelerate the Path to ${visionName}`
          : `Set the Pace for ${visionName}`,
      observation: `You have ${yearsToVision.toFixed(1)} years to work toward ${visionName}, which represents ${money.format(visionAnnualCost)} of annual lifestyle funding in your MAP.`,
      evidence: `${money.format(requiredMonthlyInvestment)} per month is the straight-line pace for the stated target net-worth gap`,
      reason:
        "A shorter timeline increases the monthly amount your current structure must support. This is a planning comparison, not a return forecast or claim of permanent lifestyle funding.",
      action:
        yearsToVision <= 5
          ? `${money.format(requiredMonthlyInvestment)} per month is the current Vision pace: decide this week whether its first funding source is surplus, existing cash or an asset-structure change.`
          : `${money.format(requiredMonthlyInvestment)} per month is the current Vision pace: decide this week how much should come from recurring surplus rather than a future asset sale.`,
      urgency: yearsToVision <= 5 ? 5 : yearsToVision <= 10 ? 4 : 2,
      impact: 5,
      confidence: 4,
      actionability: 5,
      overlapGroup: "vision",
      actionCategories: [
        "increase-investing",
        "change-income",
        "reduce-spending",
      ],
    });

  if (cashAfterInvesting > 0)
    add({
      id: "unallocated-surplus",
      category: "Cash Flow",
      title: "Give Unallocated Surplus a Job",
      observation: `${money.format(cashAfterInvesting)} of estimated annual surplus remains after reported investing.`,
      evidence: `${money.format(availableSurplus)} annual surplus − ${money.format(annualInvesting)} annual investing = ${money.format(cashAfterInvesting)} unallocated`,
      reason:
        "Unassigned surplus can disappear into irregular spending instead of deliberately strengthening liquidity, reducing debt or building wealth.",
      action: `${money.format(cashAfterInvesting)} per year (${money.format(cashAfterInvesting / 12)} per month) is unallocated: decide this week whether it goes to liquidity, debt reduction, investing or a named planned expense.`,
      urgency: 5,
      impact: 5,
      confidence: 5,
      actionability: 5,
      overlapGroup: "investing",
      actionCategories: [
        "increase-investing",
        "increase-liquidity",
        "repay-debt",
      ],
    });

  candidates.sort(
    (a, b) =>
      b.urgency - a.urgency ||
      b.impact - a.impact ||
      b.confidence - a.confidence ||
      b.actionability - a.actionability ||
      a.id.localeCompare(b.id),
  );
  const used = new Set<string>();
  const selected = candidates
    .filter((candidate) => {
      if (used.has(candidate.overlapGroup)) return false;
      used.add(candidate.overlapGroup);
      return true;
    });
  const rankedFindings: Finding[] = selected.map(
    ({ actionCategories, ...candidate }) => {
      const proposed = data.proposedActions.find((item) =>
        item.category ? actionCategories.includes(item.category) : false,
      );
      const userAction =
        proposed?.description || "You did not propose an action for this area.";
      const mapPerspective = proposed
        ? "Your proposed action addresses this issue. Review the evidence and alternatives before deciding how to proceed."
        : data.proposedActions.length > 0
          ? "This issue ranks above the actions you proposed and deserves review before you commit elsewhere."
          : "Your numbers indicate that this area deserves review before you make another major financial decision.";
      return { ...candidate, userAction, mapPerspective };
    },
  );
  const evidenceForCategory = (category: ActionCategory) => {
    switch (category) {
      case "review-asset":
      case "reallocate-investments":
        return `${money.format(totalAssets)} total assets; ${percent(largestAssetPercent)} in the largest holding`;
      case "increase-liquidity":
        return accessibleMonths === null
          ? `${money.format(accessibleAssets)} in accessible assets; lifestyle runway cannot be calculated from the information entered`
          : `${money.format(accessibleAssets)} in accessible assets, equal to ${accessibleMonths.toFixed(1)} months of current lifestyle costs`;
      case "increase-investing":
        return `${money.format(annualInvesting)} invested annually; ${money.format(cashAfterInvesting)} remains after lifestyle costs and investing`;
      case "reduce-spending":
        return `${money.format(currentLifestyle)} current annual lifestyle cost against ${money.format(takeHomeIncome)} estimated take-home income`;
      case "repay-debt":
        return `${money.format(totalLiabilities)} total liabilities with ${money.format(totalAnnualInterest)} estimated annual interest`;
      case "change-income":
        return `${money.format(takeHomeIncome)} estimated take-home income and ${money.format(availableSurplus)} available annual surplus`;
      case "fund-goal":
        return `${data.wealthGoals.length} stated life goal${data.wealthGoals.length === 1 ? "" : "s"} and ${money.format(annualInvesting)} of annual investing`;
      case "separate-finances":
        return `${data.liabilities.filter((item) => item.classification === "business").length} business liabilit${data.liabilities.filter((item) => item.classification === "business").length === 1 ? "y" : "ies"} entered`;
      case "protect-risk":
        return "Insurance cover, dependants and risk-capacity details were not collected in this assessment";
      case "tax-planning":
        return "Tax regime, deductions, capital gains and entity-level tax details were not collected";
      case "estate-planning":
        return "Will, nomination, ownership and succession documents were not collected";
      default:
        return "This action is recorded, but the assessment does not contain enough structured information to validate it";
    }
  };
  const tradeoffForCategory: Record<ActionCategory, string> = {
    "review-asset": "Changing an asset can affect liquidity, taxes, income and concentration at the same time.",
    "increase-liquidity": "More liquidity improves flexibility but may reduce long-term return potential.",
    "increase-investing": "Higher investing must remain affordable after lifestyle costs, debt commitments and reserves.",
    "reallocate-investments": "Reallocation can change risk, tax and liquidity; holdings and loss capacity must be reviewed first.",
    "reduce-spending": "Cost reductions should protect essential commitments and the life your Vision is intended to support.",
    "repay-debt": "Faster repayment uses cash that may also be needed for liquidity, goals or investment commitments.",
    "change-income": "Income changes may affect stability, time, benefits, taxes and business risk.",
    "protect-risk": "Protection needs depend on dependants, obligations, existing cover and the capacity to absorb loss.",
    "fund-goal": "Funding one goal can delay another, so timing and importance should be considered together.",
    "tax-planning": "Tax efficiency should not override suitability, liquidity or the underlying economic value of a decision.",
    "estate-planning": "Ownership, nomination and succession choices can have legal and tax consequences.",
    "separate-finances": "Separation can improve clarity while changing funding, guarantees and tax treatment.",
    other: "The financial effect depends on details that are not represented by the selected category alone.",
  };
  const questionForCategory: Record<ActionCategory, string> = {
    "review-asset": "How would this change affect concentration, liquidity, income and tax after costs?",
    "increase-liquidity": "How many months of current lifestyle costs should remain immediately accessible?",
    "increase-investing": "What recurring amount is sustainable after reserves, debt and near-term goals are protected?",
    "reallocate-investments": "Does the proposed allocation match my time horizon, loss capacity and liquidity needs?",
    "reduce-spending": "Which costs can change without undermining essential commitments or my stated Vision?",
    "repay-debt": "Which liability should be repaid first after comparing rate, tax treatment, security and liquidity?",
    "change-income": "What income change improves capacity without creating unacceptable concentration or instability?",
    "protect-risk": "What risks could prevent this Vision, and which should be retained, reduced or insured?",
    "fund-goal": "What funding path protects this goal without displacing a more important commitment?",
    "tax-planning": "What tax assumptions and alternatives must be verified before acting?",
    "estate-planning": "Do ownership, nominations and estate documents reflect my intentions and applicable law?",
    "separate-finances": "Which assets, liabilities and cash flows should be separated, and what obligations remain personal?",
    other: "What information and alternatives are needed to judge whether this action supports my Vision?",
  };
  const surplusFundingPattern =
    /\b(?:annual|monthly|available|unallocated)?\s*surplus\b|\b(?:spare|excess)\s+cash\b|\bcash\s+(?:left|remaining)\s+after\s+(?:costs?|expenses?)\b|\bdisposable\s+income\b/i;
  const surplusDependentCategories = new Set<ActionCategory>([
    "increase-investing",
    "increase-liquidity",
    "repay-debt",
    "fund-goal",
  ]);
  const actionAssessments: ActionAssessment[] = data.proposedActions
    .filter(
      (item): item is ProposedAction & { category: ActionCategory } =>
        Boolean(item.category),
    )
    .map((item) => {
      const matches = selected.filter((candidate) =>
        candidate.actionCategories.includes(item.category),
      );
      const strongest = matches[0];
      const isSurplusFunded =
        surplusDependentCategories.has(item.category) &&
        surplusFundingPattern.test(item.description);
      const surplusFundingUnavailable =
        isSurplusFunded && availableSurplus <= 0;
      const surplusFundingAvailable =
        isSurplusFunded && availableSurplus > 0;
      const contradictsCapacity =
        item.category === "increase-investing" && cashAfterInvesting < 0;
      const contradictsDebt =
        item.category === "repay-debt" && totalLiabilities <= 0;
      const needsSpecialistData = [
        "protect-risk",
        "tax-planning",
        "estate-planning",
        "reallocate-investments",
      ].includes(item.category);
      const status: ActionAssessmentStatus =
        surplusFundingUnavailable
          ? "not-supported"
          : contradictsCapacity || contradictsDebt
          ? "reconsider"
          : needsSpecialistData
            ? "more-information"
            : strongest || surplusFundingAvailable
              ? "supported"
              : item.category === "other"
                ? "more-information"
                : "refine";
      const horizon: ActionHorizon =
        status === "not-supported"
          ? "resolve-gap-first"
          : status === "reconsider" || status === "more-information"
          ? "discuss"
          : strongest && strongest.urgency >= 4
            ? "act-now"
            : status === "supported"
              ? "plan-next"
              : "monitor";
      const perspective =
        status === "not-supported"
          ? `This action depends on annual surplus, but current lifestyle costs and debt repayment exceed estimated take-home income by ${money.format(Math.abs(availableSurplus))}. Restore a positive annual surplus before funding this action.`
          : status === "reconsider"
          ? contradictsCapacity
            ? "The proposed increase exceeds the current annual surplus. Confirm its funding source before committing."
            : "No liability balance was entered, so a repayment action cannot yet be validated."
          : status === "more-information"
            ? "The action may be important, but this assessment does not collect the information required to evaluate suitability or consequences."
            : strongest
              ? strongest.reason
              : "The action is directionally relevant, but the current data does not make it an immediate financial priority.";
      return {
        id: item.id,
        category: item.category,
        action: item.description,
        status,
        horizon,
        evidence: strongest?.evidence || evidenceForCategory(item.category),
        perspective,
        tradeoff: tradeoffForCategory[item.category],
        nextStep:
          surplusFundingUnavailable
            ? item.category === "repay-debt"
              ? `Close the ${money.format(Math.abs(availableSurplus))} annual cash-flow shortfall (${money.format(Math.abs(availableSurplus) / 12)} per month) before allocating cash to accelerated repayment.`
              : `Close the ${money.format(Math.abs(availableSurplus))} annual cash-flow shortfall (${money.format(Math.abs(availableSurplus) / 12)} per month) before funding this action.`
            : strongest?.action ||
              "Document the amount, timing, alternatives and expected effect before making this decision.",
        discussionQuestion: questionForCategory[item.category],
      };
    });
  const addressedFindingIds = new Set(
    selected
      .filter((candidate) =>
        data.proposedActions.some(
          (item) =>
            item.category && candidate.actionCategories.includes(item.category),
        ),
      )
      .map((candidate) => candidate.id),
  );
  const unaddressedFindings = rankedFindings.filter(
    (finding) => !addressedFindingIds.has(finding.id),
  );
  const findings = rankedFindings;
  const nextFindings: Finding[] = [];

  return {
    estimatedTax,
    takeHomeIncome,
    totalAssets,
    wealthAssets,
    personalAssets,
    totalLiabilities,
    totalAnnualInterest,
    totalAnnualDebtRepayment,
    annualDebtRepaymentDeducted,
    assetIncomeInterestCoverage,
    networth,
    annualNeeds,
    annualWants,
    currentLifestyle,
    lifestyleCostShareOfTakeHome,
    availableSurplus,
    cashAfterInvesting,
    annualInvesting,
    investingRate,
    wealthAssetPercent,
    personalAssetPercent,
    debtPercent,
    propertyPercent,
    accessibleAssets,
    accessibleMonths,
    largestAsset,
    largestAssetPercent,
    visionAnnualCost,
    yearsToVision,
    visionFundingGap,
    requiredMonthlyInvestment,
    totalAssetIncome,
    incomeGeneratingAssets,
    assetIncomeYield,
    networthIncomeYield,
    lifestyleFundedByAssetIncome,
    actionAssessments,
    unaddressedFindings,
    findings,
    nextFindings,
  };
}
