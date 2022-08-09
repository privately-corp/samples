package ch.privately.owas.owasnlpintegration;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.util.Locale;
import java.util.Set;

import ch.privately.owas.nlp.textanalysis.analyzer.HateSpeechAnalyzer;
import ch.privately.owas.nlp.textanalysis.analyzer.ProfanityAnalyzer;
import ch.privately.owas.nlp.textanalysis.analyzer.SensitiveInfoAnalyzer;
import ch.privately.owas.nlp.textanalysis.analyzer.SentencePieceTokenizer;
import ch.privately.owas.nlp.textanalysis.analyzer.ToxicityAnalyzer;
import ch.privately.owas.nlp.textanalysis.result.SensitiveInfoMatch;
import ch.privately.owas.nlp.textanalysis.result.SensitiveInfoResult;

public class MainActivity extends AppCompatActivity {

    private EditText inputText;
    private Button clearTextButton;
    private Button analyseTextButton;
    private TextView hateSpeechResult;
    private TextView toxicityResult;
    private TextView profanityResult;
    private TextView sensitiveInfoResult;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        inputText = findViewById(R.id.edit_text);
        clearTextButton = findViewById(R.id.clear_button);
        analyseTextButton = findViewById(R.id.analyze_button);
        hateSpeechResult = findViewById(R.id.hate_speech_result_text_view);
        toxicityResult = findViewById(R.id.toxicity_result_text_view);
        profanityResult = findViewById(R.id.profanity_result_text_view);
        sensitiveInfoResult = findViewById(R.id.sensitive_info_result_text_view);

        clearTextButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (inputText.getText() != null) {
                    inputText.getText().clear();
                }
            }
        });

        analyseTextButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (inputText.getText() != null) {
                    String text = inputText.getText().toString();

                    float hateSpeechScore = HateSpeechAnalyzer.INSTANCE.analyzeText(text);
                    float toxicitySpeechScore = ToxicityAnalyzer.INSTANCE.analyzeText(text);
                    boolean containsProfanity = ProfanityAnalyzer.INSTANCE.containsProfanity(text);
                    SensitiveInfoResult sensitiveInfoAnalysisResult = SensitiveInfoAnalyzer.INSTANCE.analyzeText(text);

                    hateSpeechResult.setText(String.format(Locale.ROOT, "Hate speech result: %.2f", hateSpeechScore));
                    toxicityResult.setText(String.format(Locale.ROOT, "Toxicity result: %.2f", toxicitySpeechScore));
                    profanityResult.setText("Contains profanity: " + containsProfanity);
                    sensitiveInfoResult.setText("Sensitive info: " + getSensitiveInfoResultAsString(sensitiveInfoAnalysisResult));
                }
            }
        });

        HateSpeechAnalyzer.INSTANCE.init(this);
        ToxicityAnalyzer.INSTANCE.init(this);
        ProfanityAnalyzer.INSTANCE.init();
        SensitiveInfoAnalyzer.INSTANCE.init();
        SentencePieceTokenizer.INSTANCE.init(this);
    }

    private String getSensitiveInfoResultAsString(SensitiveInfoResult sensitiveInfoResult) {
        Set<SensitiveInfoMatch> sensitiveInfoMatches = sensitiveInfoResult.asSet();
        if (sensitiveInfoMatches.isEmpty()) {
            return "none";
        } else {
            return TextUtils.join(", ", sensitiveInfoMatches).toLowerCase(Locale.ROOT);
        }
    }
}