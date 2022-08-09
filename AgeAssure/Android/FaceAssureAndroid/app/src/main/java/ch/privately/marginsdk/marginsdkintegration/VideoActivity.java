package ch.privately.marginsdk.marginsdkintegration;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import ch.privately.ageestimation.image.AgeEstimationImageCallback;
import ch.privately.ageestimation.image.AgeEstimationImageCore;
import ch.privately.ageestimation.image.estimation.AgeEstimationImageResult;
import ch.privately.ageestimation.image.estimation.VideoAgeEstimationView;

public class VideoActivity extends Activity {
    private static final String TAG = "VideoActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_video_age_estimation);

        VideoAgeEstimationView ageEstimationView = findViewById(R.id.video_age_estimation_view);
        AgeEstimationImageCore.registerAgeEstimationCallback(new AgeEstimationImageCallback() {
            @Override
            public void onVideoAgeEstimationResult(AgeEstimationImageResult ageEstimationResult) {
                Log.i(TAG, "Age estimation: " + ageEstimationResult.getAgeRange());
            }

            @Override
            public void onImageAgeEstimationResult(AgeEstimationImageResult ageEstimationResult) {

            }
        });

        ageEstimationView.initView(this);
    }
}
