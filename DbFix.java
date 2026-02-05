import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DbFix {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/car_backend?useSSL=false&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = "root";

        try (Connection conn = DriverManager.getConnection(url, user, password);
                Statement stmt = conn.createStatement()) {

            System.out.println("Connected to database. Executing ALTER TABLE...");
            stmt.execute("ALTER TABLE invoice MODIFY COLUMN payment_method VARCHAR(50)");
            System.out.println("Successfully modified invoice table.");

        } catch (Exception e) {
            System.err.println("Error fixing database: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
