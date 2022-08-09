package ch.privately.marginsdk.marginsdkintegration;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import ch.privately.ageestimation.image.AgeEstimationImageCallback;
import ch.privately.ageestimation.image.AgeEstimationImageCore;
import ch.privately.ageestimation.image.estimation.AgeEstimationImageResult;
import ch.privately.ageestimation.image.estimation.ImageAgeEstimationView;

public class ImageActivity extends Activity {
    private static final String TAG = "ImageActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_image_age_estimation);

        ImageAgeEstimationView ageEstimationView = findViewById(R.id.image_age_estimation_view);
        AgeEstimationImageCore.registerAgeEstimationCallback(new AgeEstimationImageCallback() {
            @Override
            public void onVideoAgeEstimationResult(AgeEstimationImageResult ageEstimationResult) {

            }

            @Override
            public void onImageAgeEstimationResult(AgeEstimationImageResult ageEstimationResult) {
                Log.i(TAG, "Age estimation: " + ageEstimationResult.getAgeRange());
            }
        });

        ageEstimationView.initView(this);
    }
}
