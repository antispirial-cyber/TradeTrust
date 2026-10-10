package com.tradetrust;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

public class ScoreUtilTest {

    @Test
    public void testTieredDeductionSmallAmount() {
        // Less than ₹5,000 dispute amount -> Base deduction only (2.00)
        BigDecimal deduction = ScoreUtil.calculateTieredDeduction(new BigDecimal("3000.00"));
        assertEquals(new BigDecimal("2.00"), deduction);
    }

    @Test
    public void testTieredDeductionMediumAmount() {
        // Between ₹5,000 and ₹25,000 dispute amount -> Base (2.00) + 0.50 = 2.50
        BigDecimal deduction = ScoreUtil.calculateTieredDeduction(new BigDecimal("15000.00"));
        assertEquals(new BigDecimal("2.50"), deduction);
    }

    @Test
    public void testTieredDeductionLargeAmount() {
        // Between ₹25,000 and ₹100,000 dispute amount -> Base (2.00) + 1.00 = 3.00
        BigDecimal deduction = ScoreUtil.calculateTieredDeduction(new BigDecimal("50000.00"));
        assertEquals(new BigDecimal("3.00"), deduction);
    }

    @Test
    public void testTieredDeductionHugeAmount() {
        // Over ₹100,000 dispute amount -> Base (2.00) + 1.50 = 3.50
        BigDecimal deduction = ScoreUtil.calculateTieredDeduction(new BigDecimal("250000.00"));
        assertEquals(new BigDecimal("3.50"), deduction);
    }

    @Test
    public void testNullAmountHandledGracefully() {
        BigDecimal deduction = ScoreUtil.calculateTieredDeduction(null);
        assertEquals(new BigDecimal("2.00"), deduction);
    }
}
