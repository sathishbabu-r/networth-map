import { describe, expect, it } from "vitest";
import {
  calculateAnnualInterest,
  calculateMap,
  emptyAssessment,
  formatActionsForClipboard,
  normalizeAssetPurpose,
  type AssessmentData,
} from "../shared/networth-engine";
import {
  isValidIsoDate,
  localIsoDate,
  normalizePercentageInput,
} from "../src/original-map/networth-inputs";
import { normalizeSavedAssessment } from "../src/original-map/networth-assessment";

const data = (overrides: Partial<AssessmentData>): AssessmentData => ({
  ...emptyAssessment,
  ...overrides,
});

describe("Networth MAP V2 engine", () => {
  it("validates assessment input helpers without changing valid precision", () => {
    expect(normalizePercentageInput("18.75")).toBe("18.75");
    expect(normalizePercentageInput("1a8..759")).toBe("18.75");
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(localIsoDate(new Date(2026, 8, 3, 0, 15))).toBe("2026-09-03");
  });

  it("preserves decimal tax rates and unknown liability rates and repayments when restoring", () => {
    const restored = normalizeSavedAssessment({
      version: 15,
      expiresAt: Date.now() + 60_000,
      step: 3,
      data: {
        ...emptyAssessment,
        effectiveTaxRate: "18.75",
        liabilities: [
          {
            id: "loan",
            description: "Family loan",
            type: "personal",
            value: "100000",
            interestRate: "",
            classification: "personal",
          },
        ],
      },
    });

    expect(restored?.data.effectiveTaxRate).toBe("18.75");
    expect(restored?.data.liabilities[0].interestRate).toBe("");
    expect(restored?.data.liabilities[0].annualRepayment).toBe("");
    expect(restored?.data.liabilities[0].repaymentIncludedInNeeds).toBe(false);
    expect(restored?.data.loanRepaymentIncludedInNeeds).toBe(false);
  });

  it("restores all four income profiles without changing legacy choices", () => {
    for (const userType of [
      "founder",
      "business-owner",
      "professional",
      "salaried",
    ] as const) {
      const restored = normalizeSavedAssessment({
        version: 17,
        expiresAt: Date.now() + 60_000,
        step: 1,
        data: { ...emptyAssessment, userType },
      });
      expect(restored?.data.userType).toBe(userType);
    }
  });

  it("preserves an action target date when a saved assessment is reopened", () => {
    const restored = normalizeSavedAssessment({
      version: 17,
      expiresAt: Date.now() + 60_000,
      step: 10,
      data: {
        ...emptyAssessment,
        proposedActions: [
          {
            id: "action-1",
            category: "increase-investing",
            description: "Increase my annual investing",
            targetDate: "2027-09-15",
          },
        ],
      },
    });

    expect(restored?.data.proposedActions[0]?.targetDate).toBe("2027-09-15");
  });

  it("applies recurring lifestyle changes to every selected lifestyle level", () => {
    const result = calculateMap(
      data({
        visionLevel: "security",
        visionChoiceConfirmed: true,
        monthlyNeeds: "90000",
        monthlyWants: "30000",
        lifestyleChanges: [
          {
            id: "care",
            category: "family",
            description: "Monthly family support",
            direction: "increase",
            monthlyAmount: "10000",
            startDate: "2030-04-01",
          },
        ],
      }),
    );

    expect(result.visionAnnualCost).toBe(1_200_000);
    expect(result.yearsToVision).toBeGreaterThan(0);
  });

  it("preserves current investment selections and migrates legacy asset roles", () => {
    expect(normalizeAssetPurpose("investment")).toBe("investment");
    expect(normalizeAssetPurpose("wealth")).toBe("investment");
    expect(normalizeAssetPurpose("growth")).toBe("investment");
    expect(normalizeAssetPurpose("income")).toBe("investment");
    expect(normalizeAssetPurpose("personal")).toBe("personal");
    expect(normalizeAssetPurpose("unknown")).toBe("");
  });

  it("treats an empty asset list as zero throughout the financial position", () => {
    const result = calculateMap(
      data({
        assets: [],
        liabilities: [
          {
            id: "loan",
            description: "Home loan",
            type: "property",
            value: "4200000",
            classification: "personal",
          },
        ],
      }),
    );

    expect(result.totalAssets).toBe(0);
    expect(result.networth).toBe(-4_200_000);
    expect(result.wealthAssetPercent).toBe(0);
  });

  it("calculates annual liability interest from balance and decimal rate", () => {
    expect(
      calculateAnnualInterest({
        id: "home-loan",
        description: "Home loan",
        type: "property",
        value: "5000000",
        interestRate: "8.5",
        classification: "personal",
      }),
    ).toBe(425_000);
  });

  it("totals estimated annual interest across liabilities", () => {
    const result = calculateMap(
      data({
        liabilities: [
          {
            id: "home-loan",
            description: "Home loan",
            type: "property",
            value: "5000000",
            interestRate: "8.5",
            classification: "personal",
          },
          {
            id: "car-loan",
            description: "Car loan",
            type: "vehicle",
            value: "1000000",
            interestRate: "10",
            classification: "personal",
          },
        ],
      }),
    );

    expect(result.totalAnnualInterest).toBe(525_000);
    expect(result.assetIncomeInterestCoverage).toBe(0);
  });

  it("subtracts only repayments outside household costs from surplus", () => {
    const result = calculateMap(
      data({
      grossPersonalIncome: "2400000",
      effectiveTaxRate: "25",
      assets: [
        {
          id: "assets",
          description: "Assets",
          category: "financial",
          value: "13300000",
          purpose: "investment",
        },
      ],
      liabilities: [
        {
          id: "home-loan",
          description: "Home loan",
          type: "property",
          value: "4200000",
          interestRate: "8.6",
          annualRepayment: "500000",
          repaymentIncludedInNeeds: true,
          classification: "personal",
        },
        {
          id: "car-loan",
          description: "Car loan",
          type: "vehicle",
          value: "600000",
          interestRate: "10",
          annualRepayment: "200000",
          repaymentIncludedInNeeds: false,
          classification: "personal",
        },
      ],
      monthlyNeeds: "90000",
      monthlyWants: "45000",
      annualInvesting: "150000",
      }),
    );

    expect(result.takeHomeIncome).toBe(1_800_000);
    expect(result.currentLifestyle).toBe(1_620_000);
    expect(result.totalAnnualDebtRepayment).toBe(700_000);
    expect(result.annualDebtRepaymentDeducted).toBe(200_000);
    expect(result.availableSurplus).toBe(-20_000);
  });

  it("copies the legacy global repayment answer onto every saved liability", () => {
    const restored = normalizeSavedAssessment({
      version: 16,
      expiresAt: Date.now() + 60_000,
      step: 3,
      data: {
        ...emptyAssessment,
        loanRepaymentIncludedInNeeds: true,
        liabilities: [
          {
            id: "home-loan",
            description: "Home loan",
            type: "property",
            value: "4200000",
            annualRepayment: "500000",
            classification: "personal",
          },
          {
            id: "car-loan",
            description: "Car loan",
            type: "vehicle",
            value: "600000",
            annualRepayment: "200000",
            classification: "personal",
          },
        ],
      },
    });

    expect(
      restored?.data.liabilities.map(
        (liability) => liability.repaymentIncludedInNeeds,
      ),
    ).toEqual([true, true]);
  });

  it("treats legacy liabilities without repayment data as zero", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "2400000",
        effectiveTaxRate: "25",
        monthlyNeeds: "90000",
        monthlyWants: "45000",
        liabilities: [
          {
            id: "legacy-loan",
            description: "Legacy home loan",
            type: "property",
            value: "4200000",
            interestRate: "8.6",
            classification: "personal",
          },
        ],
      }),
    );

    expect(result.totalAnnualDebtRepayment).toBe(0);
    expect(result.availableSurplus).toBe(180_000);
  });

  it("compares reported asset income with estimated annual interest", () => {
    const result = calculateMap(
      data({
        assets: [
          {
            id: "deposit",
            description: "Fixed deposit",
            category: "financial",
            value: "2000000",
            annualNetIncome: "200000",
            purpose: "investment",
          },
        ],
        liabilities: [
          {
            id: "loan",
            description: "Loan",
            type: "personal",
            value: "1000000",
            interestRate: "10",
            classification: "personal",
          },
        ],
      }),
    );

    expect(result.assetIncomeInterestCoverage).toBe(200);
  });

  it("builds Amar's ₹10 crore Blueprint without treating business revenue as income", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "6000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "200000",
        monthlyWants: "100000",
        annualInvesting: "1200000",
        assets: [
          {
            id: "farm",
            description: "Farmland",
            category: "property",
            value: "70000000",
            purpose: "investment",
          },
          {
            id: "home",
            description: "Primary home",
            category: "property",
            value: "30000000",
            purpose: "personal",
          },
          {
            id: "second",
            description: "Second house",
            category: "property",
            value: "10000000",
            purpose: "investment",
          },
          {
            id: "mf",
            description: "Mutual funds",
            category: "financial",
            value: "10000000",
            purpose: "investment",
          },
        ],
        liabilities: [
          {
            id: "bank",
            description: "Bank loan",
            type: "property",
            value: "10000000",
            classification: "personal",
          },
          {
            id: "business",
            description: "Personally guaranteed business liability",
            type: "business",
            value: "10000000",
            classification: "business",
          },
        ],
      }),
    );
    expect(result.takeHomeIncome).toBe(4_800_000);
    expect(result.totalAssets).toBe(120_000_000);
    expect(result.networth).toBe(100_000_000);
    expect(result.wealthAssets).toBe(90_000_000);
    expect(result.personalAssets).toBe(30_000_000);
    expect(
      result.findings.some((finding) => finding.id === "asset-concentration"),
    ).toBe(true);
    expect(
      [...result.findings, ...result.nextFindings].some(
        (finding) => finding.id === "asset-income-role",
      ),
    ).toBe(false);
  });

  it("separates Needs, Wants, available surplus and cash after investing", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "5000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "200000",
        monthlyWants: "100000",
        annualInvesting: "1000000",
      }),
    );
    expect(result.annualNeeds).toBe(2_400_000);
    expect(result.annualWants).toBe(1_200_000);
    expect(result.currentLifestyle).toBe(3_600_000);
    expect(result.lifestyleCostShareOfTakeHome).toBe(90);
    expect(result.availableSurplus).toBe(400_000);
    expect(result.cashAfterInvesting).toBe(-600_000);
  });

  it("measures accessible asset coverage against needs and wants", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "60000",
        monthlyWants: "40000",
        assets: [
          {
            id: "cash",
            description: "Cash",
            category: "cash",
            value: "1200000",
            purpose: "investment",
          },
        ],
      }),
    );

    expect(result.accessibleMonths).toBe(12);
  });

  it("shows negative net worth without invalid ratios", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "100000",
        liabilities: [
          {
            id: "loan",
            description: "Personal loan",
            type: "personal",
            value: "1000000",
            classification: "personal",
          },
        ],
      }),
    );
    expect(result.networth).toBe(-1_000_000);
    expect(result.debtPercent).toBe(0);
    expect(Number.isFinite(result.propertyPercent)).toBe(true);
  });

  it("acknowledges a proposed asset sale without approving it", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "5000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "100000",
        monthlyWants: "100000",
        annualInvesting: "1000000",
        assets: [
          {
            id: "farm",
            description: "Farmland",
            category: "property",
            value: "70000000",
            purpose: "investment",
          },
          {
            id: "funds",
            description: "Mutual funds",
            category: "financial",
            value: "10000000",
            purpose: "investment",
          },
        ],
        proposedActions: [
          {
            id: "sell",
            category: "review-asset",
            description: "Sell my farmland",
          },
        ],
      }),
    );
    const concentration = result.findings.find(
      (finding) => finding.id === "asset-concentration",
    );
    expect(concentration?.userAction).toBe("Sell my farmland");
    expect(concentration?.mapPerspective).toContain(
      "Review the evidence and alternatives before deciding",
    );
    expect(concentration?.action).toContain("Investments");
    expect(concentration?.action).toMatch(/concentration.*liquidity/i);
    expect(concentration?.action).not.toMatch(/whether its role|choose.*role/i);
  });

  it("builds a fully concentrated asset action on the role already selected", () => {
    const result = calculateMap(
      data({
        assets: [
          {
            id: "index",
            description: "Index fund",
            category: "financial",
            value: "10000000",
            purpose: "investment",
          },
        ],
      }),
    );
    const concentration = result.findings.find(
      (finding) => finding.id === "asset-concentration",
    );

    expect(concentration?.action).toContain("100.0% concentration");
    expect(concentration?.action).toContain("Investments");
    expect(concentration?.action).toContain("your goal");
    expect(concentration?.action).toContain("liquidity");
    expect(concentration?.action).toContain("next 12 months");
    expect(concentration?.action).not.toMatch(/choose.*role|whether its role/i);
  });

  it("frames Vision as an annual lifestyle requirement without certifying independence", () => {
    const result = calculateMap(
      data({
        visionLevel: "freedom",
        monthlyNeeds: "200000",
        monthlyWants: "200000",
        desiredLifestyleMonthly: "800000",
      }),
    );
    expect(result.visionAnnualCost).toBe(9_600_000);
    expect(JSON.stringify(result)).not.toMatch(
      /you are financially independent/i,
    );
  });

  it("keeps every distinct supported finding without a fixed priority cap", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "4800000",
        effectiveTaxRate: "20",
        monthlyNeeds: "300000",
        monthlyWants: "200000",
        annualInvesting: "1200000",
        visionLevel: "freedom",
        desiredLifestyleMonthly: "1000000",
        assets: [
          {
            id: "land",
            description: "Farmland",
            category: "property",
            value: "70000000",
            purpose: "investment",
          },
          {
            id: "cash",
            description: "Bank balance",
            category: "cash",
            value: "500000",
            purpose: "investment",
          },
        ],
        liabilities: [
          {
            id: "loan",
            description: "Loans",
            type: "property",
            value: "30000000",
            classification: "personal",
          },
        ],
      }),
    );
    expect(result.findings).toHaveLength(6);
    expect(result.nextFindings).toHaveLength(0);
    expect(
      new Set(
        [...result.findings, ...result.nextFindings].map(
          (finding) => finding.overlapGroup,
        ),
      ).size,
    ).toBe(6);
  });

  it("calculates reported asset income yields from present market values", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "5000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "200000",
        monthlyWants: "100000",
        assets: [
          {
            id: "rental",
            description: "Rental property",
            category: "property",
            value: "20000000",
            purpose: "investment",
            annualNetIncome: "800000",
          },
          {
            id: "home",
            description: "Primary home",
            category: "property",
            value: "30000000",
            purpose: "personal",
            annualNetIncome: "0",
          },
          {
            id: "funds",
            description: "Income fund",
            category: "financial",
            value: "10000000",
            purpose: "investment",
            annualNetIncome: "200000",
          },
        ],
      }),
    );
    expect(result.totalAssetIncome).toBe(1_000_000);
    expect(result.incomeGeneratingAssets).toBe(30_000_000);
    expect(result.assetIncomeYield).toBeCloseTo(3.3333, 3);
    expect(result.networthIncomeYield).toBeCloseTo(1.6667, 3);
    expect(result.lifestyleFundedByAssetIncome).toBeCloseTo(27.7778, 3);
    expect(result.availableSurplus).toBe(400_000);
  });

  it("does not manufacture asset-income percentages without valid denominators", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "100000",
        assets: [],
        liabilities: [
          {
            id: "loan",
            description: "Loan",
            type: "personal",
            value: "1000000",
            classification: "personal",
          },
        ],
      }),
    );
    expect(result.assetIncomeYield).toBeNull();
    expect(result.networthIncomeYield).toBeNull();
    expect(result.lifestyleFundedByAssetIncome).toBe(0);
  });

  it("calculates asset-income yield only from assets that report income", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "100000",
        assets: [
          {
            id: "rental",
            description: "Rental property",
            category: "property",
            value: "20000000",
            purpose: "investment",
            annualNetIncome: "800000",
          },
          {
            id: "land",
            description: "Non-income farmland",
            category: "property",
            value: "10000000",
            purpose: "investment",
            annualNetIncome: "0",
          },
        ],
      }),
    );
    expect(result.incomeGeneratingAssets).toBe(20_000_000);
    expect(result.assetIncomeYield).toBe(4);
  });

  it("reports asset income without turning it into a missing-income priority", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "3000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "100000",
        monthlyWants: "0",
        annualInvesting: "600000",
        assets: [
          {
            id: "rental",
            description: "Rental property",
            category: "property",
            value: "20000000",
            purpose: "investment",
            annualNetIncome: "240000",
          },
          {
            id: "cash",
            description: "Deposits",
            category: "cash",
            value: "20000000",
            purpose: "investment",
          },
          {
            id: "funds",
            description: "Mutual funds",
            category: "financial",
            value: "20000000",
            purpose: "investment",
          },
        ],
      }),
    );
    expect(result.totalAssetIncome).toBe(240_000);
    expect(
      [...result.findings, ...result.nextFindings].some(
        (finding) => finding.id === "asset-income-role",
      ),
    ).toBe(false);
  });

  it("treats zero income as normal for an investment asset", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "100000",
        assets: [
          {
            id: "index",
            description: "Index fund",
            category: "financial",
            value: "10000000",
            annualNetIncome: "0",
            purpose: "investment",
          },
        ],
      }),
    );

    expect(
      [...result.findings, ...result.nextFindings].some(
        (finding) => finding.id === "asset-income-role",
      ),
    ).toBe(false);
  });

  it("changes the monthly pace, ranking and action when the Vision timeline changes", () => {
    const shared: Partial<AssessmentData> = {
      userType: "salaried",
      grossPersonalIncome: "2400000",
      effectiveTaxRate: "20",
      monthlyNeeds: "100000",
      monthlyWants: "50000",
      annualInvesting: "240000",
      currentAge: "42",
      targetTiming: "age",
      targetNetworth: "30000000",
      visionLevel: "independence",
      assets: [
        {
          id: "funds",
          description: "Mutual funds",
          category: "financial",
          value: "10000000",
          purpose: "investment",
        },
      ],
    };
    const age45 = calculateMap(data({ ...shared, targetAge: "45" }));
    const age65 = calculateMap(data({ ...shared, targetAge: "65" }));
    const age45Vision = [...age45.findings, ...age45.nextFindings].find(
      (finding) => finding.id === "vision-pace",
    );
    const age65Vision = [...age65.findings, ...age65.nextFindings].find(
      (finding) => finding.id === "vision-pace",
    );

    expect(age45.requiredMonthlyInvestment).toBeGreaterThan(
      age65.requiredMonthlyInvestment,
    );
    expect(age45.findings.map((finding) => finding.id)).not.toEqual(
      age65.findings.map((finding) => finding.id),
    );
    expect(age45Vision?.title).not.toBe(age65Vision?.title);
    expect(age45Vision?.action).not.toBe(age65Vision?.action);
  });

  it("changes the required monthly pace when the selected Vision changes", () => {
    const shared: Partial<AssessmentData> = {
      userType: "salaried",
      grossPersonalIncome: "2400000",
      effectiveTaxRate: "20",
      monthlyNeeds: "100000",
      monthlyWants: "50000",
      desiredLifestyleMonthly: "300000",
      annualInvesting: "240000",
      currentAge: "42",
      targetTiming: "age",
      targetAge: "52",
      assets: [],
    };
    const security = calculateMap(
      data({ ...shared, visionLevel: "security" }),
    );
    const freedom = calculateMap(data({ ...shared, visionLevel: "freedom" }));

    expect(freedom.requiredMonthlyInvestment).toBeGreaterThan(
      security.requiredMonthlyInvestment,
    );
  });

  it("keeps a blank-target lifestyle amount out of MAP priorities", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "90000",
        monthlyWants: "0",
        currentAge: "35",
        targetTiming: "age",
        targetAge: "45",
        targetNetworth: "",
        visionLevel: "independence",
      }),
    );

    expect(result.requiredMonthlyInvestment).toBe(9_000);
    expect(
      [...result.findings, ...result.nextFindings].some(
        (finding) => finding.id === "vision-pace",
      ),
    ).toBe(false);
  });

  it("uses only the entered net-worth gap for required monthly pace and a priority", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "90000",
        monthlyWants: "0",
        currentAge: "35",
        targetTiming: "age",
        targetAge: "45",
        targetNetworth: "12000000",
        visionLevel: "independence",
        assets: [
          {
            id: "funds",
            description: "Index fund",
            category: "financial",
            value: "1200000",
            purpose: "investment",
          },
        ],
      }),
    );

    expect(result.requiredMonthlyInvestment).toBe(90_000);
    expect(
      [...result.findings, ...result.nextFindings].filter(
        (finding) => finding.id === "vision-pace",
      ),
    ).toHaveLength(1);
  });

  it("does not create a pace priority after the target is reached", () => {
    const result = calculateMap(
      data({
        monthlyNeeds: "90000",
        monthlyWants: "0",
        targetYear: String(new Date().getFullYear() + 10),
        targetNetworth: "10000000",
        wealthMilestoneChoice: "yes",
        visionLevel: "independence",
        assets: [
          {
            id: "funds",
            description: "Index fund",
            category: "financial",
            value: "12000000",
            purpose: "investment",
          },
        ],
      }),
    );

    expect(result.requiredMonthlyInvestment).toBe(0);
    expect(result.findings.some((finding) => finding.id === "vision-pace")).toBe(
      false,
    );
  });

  it("leads with unallocated surplus and makes every displayed action numeric and decisional", () => {
    const result = calculateMap(
      data({
        userType: "salaried",
        grossPersonalIncome: "750000",
        effectiveTaxRate: "20",
        monthlyNeeds: "20000",
        monthlyWants: "0",
        annualInvesting: "240000",
        currentAge: "42",
        targetTiming: "age",
        targetAge: "60",
        visionLevel: "security",
        assets: [
          {
            id: "cash",
            description: "Savings",
            category: "cash",
            value: "1000000",
            purpose: "investment",
          },
        ],
      }),
    );

    expect(result.availableSurplus).toBe(360000);
    expect(result.cashAfterInvesting).toBe(120000);
    expect(result.findings[0]?.id).toBe("unallocated-surplus");
    expect(result.findings[0]?.action).toContain("₹1,20,000 per year");
    expect(result.findings[0]?.action).toContain("₹10,000 per month");
    for (const finding of result.findings) {
      expect(finding.action).toMatch(/^₹/);
      expect(finding.action).toContain("decide this week");
      expect(finding.action).not.toMatch(/^(Review|Consider|Choose a target)/i);
    }
  });

  it("formats the three 90-day actions as plain clipboard text", () => {
    const findings = calculateMap(
      data({
        userType: "salaried",
        grossPersonalIncome: "3000000",
        effectiveTaxRate: "20",
        monthlyNeeds: "100000",
        monthlyWants: "50000",
        annualInvesting: "300000",
        currentAge: "42",
        targetTiming: "age",
        targetAge: "50",
        visionLevel: "independence",
        assets: [
          {
            id: "property",
            description: "Rental property",
            category: "property",
            value: "20000000",
            purpose: "investment",
          },
          {
            id: "cash",
            description: "Deposits",
            category: "cash",
            value: "1000000",
            purpose: "investment",
          },
        ],
      }),
    ).findings;
    const copied = formatActionsForClipboard(findings);

    expect(copied).toContain(`1. ${findings[0]?.title}`);
    expect(copied).toContain(findings[0]?.action);
    expect(copied).not.toContain("<");
    expect(copied.split("\n\n")).toHaveLength(findings.length);
  });

  it("assesses every customer action instead of limiting the MAP to three priorities", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "1200000",
        effectiveTaxRate: "20",
        monthlyNeeds: "70000",
        monthlyWants: "20000",
        annualInvesting: "240000",
        liabilities: [
          {
            id: "loan",
            description: "Home loan",
            type: "property",
            value: "5000000",
            interestRate: "9",
            classification: "personal",
          },
        ],
        proposedActions: [
          { id: "debt", category: "repay-debt", description: "Prepay the home loan" },
          { id: "invest", category: "increase-investing", description: "Increase my SIP" },
          { id: "tax", category: "tax-planning", description: "Review my tax structure" },
          { id: "estate", category: "estate-planning", description: "Create a will" },
        ],
      }),
    );

    expect(result.actionAssessments).toHaveLength(4);
    expect(result.actionAssessments.map((item) => item.id)).toEqual([
      "debt",
      "invest",
      "tax",
      "estate",
    ]);
    expect(result.actionAssessments.find((item) => item.id === "debt")?.evidence)
      .toContain("liabilities");
    expect(result.actionAssessments.find((item) => item.id === "invest")?.status)
      .toBe("reconsider");
    expect(result.actionAssessments.find((item) => item.id === "tax")?.status)
      .toBe("more-information");
  });

  it("does not support a surplus-funded debt action until cash flow is positive", () => {
    const action = {
      id: "surplus-debt",
      category: "repay-debt" as const,
      description: "Use annual surplus to reduce the home loan faster",
    };
    const homeLoan = {
      id: "home-loan",
      description: "Home loan",
      type: "property" as const,
      value: "4200000",
      interestRate: "8.6",
      annualRepayment: "500000",
      repaymentIncludedInNeeds: false,
      classification: "personal" as const,
    };
    const shared: Partial<AssessmentData> = {
      grossPersonalIncome: "2400000",
      effectiveTaxRate: "25",
      monthlyNeeds: "90000",
      monthlyWants: "45000",
      assets: [
        {
          id: "assets",
          description: "Investment assets",
          category: "financial",
          value: "13300000",
          purpose: "investment",
        },
      ],
      proposedActions: [action],
    };
    const negative = calculateMap(data({ ...shared, liabilities: [homeLoan] }));
    const negativeAssessment = negative.actionAssessments[0];
    const positive = calculateMap(
      data({
        ...shared,
        liabilities: [{ ...homeLoan, annualRepayment: "100000" }],
      }),
    );
    const positiveAssessment = positive.actionAssessments[0];

    console.log(
      "NEW VERDICT AFTER: NOT CURRENTLY SUPPORTED — RESOLVE CASH-FLOW GAP FIRST",
    );
    console.log("POSITIVE-SURPLUS CASE: SUPPORTED BY YOUR DATA — ACT NOW");
    expect(negative.availableSurplus).toBe(-320_000);
    expect(negativeAssessment.status).toBe("not-supported");
    expect(negativeAssessment.horizon).toBe("resolve-gap-first");
    expect(negativeAssessment.nextStep).toContain(
      "Close the ₹3,20,000 annual cash-flow shortfall",
    );
    expect(negativeAssessment.nextStep).toContain(
      "before allocating cash to accelerated repayment",
    );
    expect(positive.availableSurplus).toBe(80_000);
    expect(positiveAssessment.status).toBe("supported");
    expect(positiveAssessment.horizon).toBe("act-now");
  });

  it("returns every material finding not addressed by a customer action", () => {
    const result = calculateMap(
      data({
        grossPersonalIncome: "750000",
        effectiveTaxRate: "20",
        monthlyNeeds: "45000",
        monthlyWants: "20000",
        annualInvesting: "300000",
        visionLevel: "freedom",
        desiredLifestyleMonthly: "150000",
        currentAge: "40",
        targetAge: "48",
        targetNetworth: "30000000",
        assets: [
          {
            id: "property",
            description: "Family property",
            category: "property",
            value: "8000000",
            purpose: "personal",
          },
        ],
        liabilities: [
          {
            id: "loan",
            description: "Property loan",
            type: "property",
            value: "4000000",
            interestRate: "10",
            classification: "personal",
          },
        ],
        proposedActions: [
          { id: "other", category: "other", description: "Discuss family finances" },
        ],
      }),
    );

    expect(result.unaddressedFindings.length).toBeGreaterThan(3);
    expect(result.unaddressedFindings).toHaveLength(result.findings.length);
  });
});
