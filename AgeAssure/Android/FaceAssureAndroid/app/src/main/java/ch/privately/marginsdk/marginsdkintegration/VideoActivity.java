package ch.privately.marginsdk.marginsdkintegration;

import android.app.Activity;
import android.graphics.PointF;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.List;

import ch.privately.ageestimation.image.AgeEstimationListener;
import ch.privately.ageestimation.image.AgeEstimationView;
import ch.privately.ageestimation.image.FaceOrientation;
import ch.privately.core.PrivatelyCore;

public class VideoActivity extends AppCompatActivity implements AgeEstimationListener {
    private static final String TAG = "VideoActivity";
    private boolean useFrontCamera = true;

    private TextView resultView;
    private AgeEstimationView cameraView;

    private List<Boolean> estimations = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_video_age_estimation);
        PrivatelyCore.INSTANCE.init(this);

        resultView = findViewById(R.id.estimation_result);
        cameraView = findViewById(R.id.video_age_estimation_view);
        cameraView.setListener(this);
        cameraView.onViewCreated(this, useFrontCamera/*, modelType*/);
        cameraView.setZoomRatio(1.0f);
    }

    public void updateEstimationScreen() {
        runOnUiThread(() -> {
            if (estimations.size() > 3) {
                if (estimations.stream().filter(x -> x).count() > estimations.size()/2) {
                    resultView.setText("25+");
                } else {
                    resultView.setText("25-");
                }
            } else {
                resultView.setText(" - ");
            }
        });
    }

    public void resetScreen() {
        estimations = new ArrayList<>();
        updateEstimationScreen();
    }

    @Override
    public void onAgeEstimated(float threshold, boolean isAbove) {
        estimations.add(isAbove);

        if (estimations.size() >= 10) {
            cameraView.pauseEstimation();
        }

        updateEstimationScreen();
    }

    @Override
    public void onEmptyScreen() {
        resetScreen();
    }

    @Override
    public void onFaceDetected(PointF rightEye, PointF leftEye, int imageWidth, int imageHeight) {
        if (estimations.size() < 10) {
            cameraView.resumeEstimations();
        }
    }

    @Override
    public void onFaceOrientationDetected(FaceOrientation faceOrientation) {

    }

    @Override
    public void onNewPerson() {
        cameraView.resumeEstimations();
        resetScreen();
    }

    @Override
    public void onPersonLeftScreen() {
        resetScreen();
    }
}
