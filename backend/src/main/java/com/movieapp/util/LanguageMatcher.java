package com.movieapp.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Helpers for the comma-separated language list stored on Movie and the single
 * language stored on Show. All comparisons are trim + case-insensitive so that
 * "Telugu", " telugu", and "TELUGU" all map to the same canonical entry.
 */
public final class LanguageMatcher {

    private LanguageMatcher() {}

    public static List<String> parse(String csv) {
        List<String> out = new ArrayList<>();
        if (csv == null) return out;
        for (String raw : csv.split(",")) {
            String t = raw.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    public static boolean matches(String movieLanguagesCsv, String showLanguage) {
        if (showLanguage == null) return false;
        String target = showLanguage.trim();
        if (target.isEmpty()) return false;
        for (String available : parse(movieLanguagesCsv)) {
            if (available.equalsIgnoreCase(target)) return true;
        }
        return false;
    }

    public static boolean hasAny(String csv) {
        return !parse(csv).isEmpty();
    }
}
